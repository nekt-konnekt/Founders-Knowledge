import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const site = (process.env.SITE_URL || "https://founders-knowledge.vercel.app").replace(/\/$/, "");
const statePath = path.join(root, "distribution", "state.json");
const outboxDir = path.join(root, "distribution", "outbox");
fs.mkdirSync(path.dirname(statePath), { recursive: true });
fs.mkdirSync(outboxDir, { recursive: true });

const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, "utf8"))
  : { version: 1, articles: {} };

function attr(tag, key) {
  const match = tag.match(new RegExp("\\b" + key + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return match ? match[2].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'") : "";
}

function meta(html, key, attribute = "property") {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attr(match[0], attribute).toLowerCase() === key.toLowerCase()) return attr(match[0], "content");
  }
  return "";
}

function clean(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ").replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
}

function getChangedLessons() {
  const manualSlug = (process.env.ARTICLE_SLUG || "").trim();
  if (manualSlug) {
    if (!/^[a-z0-9-]+$/.test(manualSlug)) throw new Error("ARTICLE_SLUG must be a lesson slug.");
    return [{ slug: manualSlug, status: "A" }];
  }

  const base = process.env.BASE_SHA || "";
  const head = process.env.HEAD_SHA || "HEAD";
  let diff;
  try {
    if (base && !/^0+$/.test(base)) {
      diff = execFileSync("git", ["diff", "--name-status", base, head], { encoding: "utf8" });
    } else {
      diff = execFileSync("git", ["diff", "--name-status", "HEAD^", head], { encoding: "utf8" });
    }
  } catch {
    diff = execFileSync("git", ["diff-tree", "--no-commit-id", "--name-status", "-r", head], { encoding: "utf8" });
  }

  const results = [];
  for (const line of diff.split("\n")) {
    const [status, file] = line.trim().split(/\s+/);
    const match = file && file.match(/^lessons\/([a-z0-9-]+)\/index\.html$/);
    if (match && ["A", "M"].includes(status)) results.push({ slug: match[1], status });
  }
  return [...new Map(results.map(item => [item.slug, item])).values()];
}

async function waitForLiveArticle(url) {
  let lastStatus = "no response";
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000) });
      if (response.ok) {
        const html = await response.text();
        if (html.includes("og:title") && html.includes("og:description")) return;
      }
      lastStatus = String(response.status);
    } catch (error) {
      lastStatus = error.message;
    }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  throw new Error("The published article was not verified live after retries (" + lastStatus + "): " + url);
}

async function sendTelegram(text, url) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { configured: false };
  const message = text + "\n\n" + url;
  const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, link_preview_options: { is_disabled: false } })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) throw new Error("Telegram delivery failed: " + (payload.description || response.status));
  return { configured: true, messageId: payload.result?.message_id };
}

async function sendLinkedIn(article, postText) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const author = process.env.LINKEDIN_AUTHOR_URN;
  if (!token || !author) return { configured: false };
  const version = process.env.LINKEDIN_VERSION;
  if (!version) throw new Error("Set the LINKEDIN_VERSION repository variable to a currently supported LinkedIn API version.");
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "LinkedIn-Version": version,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      author,
      commentary: postText,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { article: { source: article.url, title: article.title, description: article.description, thumbnail: article.image || undefined } },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    })
  });
  const body = await response.text();
  if (!response.ok) throw new Error("LinkedIn delivery failed (" + response.status + "): " + body.slice(0, 500));
  return { configured: true, postId: response.headers.get("x-restli-id") || null };
}

async function main() {
  const changed = getChangedLessons();
  if (!changed.length) {
    console.log("No lesson pages changed in this run. Nothing to distribute.");
    return;
  }

  const results = [];
  for (const item of changed) {
    const htmlPath = path.join(root, "lessons", item.slug, "index.html");
    if (!fs.existsSync(htmlPath)) continue;

    // Updates to existing articles do not create duplicate social posts by default.
    if (item.status === "M" && process.env.DISTRIBUTION_REPOST_UPDATES !== "true") {
      console.log("Skipping edited lesson (new articles only): " + item.slug);
      continue;
    }

    const html = fs.readFileSync(htmlPath, "utf8");
    const title = clean(meta(html, "og:title") || (html.match(/<title>([\s\S]*?)<\/title>/i) || [, item.slug])[1])
      .replace(/\s*[—|]\s*Founders Knowledge\s*$/i, "").trim();
    const description = clean(meta(html, "og:description") || meta(html, "description", "name"));
    const canonicalTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [""])[0];
    const canonical = meta(html, "og:url") || attr(canonicalTag, "href") || site + "/lessons/" + item.slug + "/";
    const url = new URL(canonical, site).href;
    if (new URL(url).hostname !== new URL(site).hostname) throw new Error("Refusing to distribute an off-site canonical URL: " + url);
    const image = meta(html, "og:image");
    if (!title || !description) throw new Error("Missing title or description metadata for " + item.slug);

    const fingerprint = crypto.createHash("sha256").update([url, title, description].join("\n")).digest("hex");
    const previous = state.articles[item.slug] || { fingerprint: "", channels: {} };
    const channels = previous.fingerprint === fingerprint ? { ...(previous.channels || {}) } : {};
    const postText = title + "\n\n" + description + "\n\nWhat should founders take away from this? Read the full analysis from Founders Knowledge.";
    const post = {
      brand: "Founders Knowledge",
      title, description, url, image,
      linkedin: postText + "\n\n#FoundersKnowledge #AfricanTech #Startups",
      telegram: postText,
      createdAt: new Date().toISOString(),
      delivery: { linkedin: "pending", telegram: "pending" }
    };
    fs.writeFileSync(path.join(outboxDir, item.slug + ".json"), JSON.stringify(post, null, 2) + "\n");

    const enabled = Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN) ||
      Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
    if (!enabled) {
      console.log("No distribution credentials configured. Draft pack written for " + item.slug + ".");
      results.push({ slug: item.slug, status: "draft-only" });
      continue;
    }

    await waitForLiveArticle(url);

    if (!channels.telegram && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const result = await sendTelegram(post.telegram, url);
        channels.telegram = true;
        post.delivery.telegram = "sent";
        console.log("Telegram sent: " + item.slug + " (" + (result.messageId || "confirmed") + ")");
      } catch (error) {
        post.delivery.telegram = "failed";
        console.error(error.message);
      }
    } else if (channels.telegram) post.delivery.telegram = "already-sent";

    if (!channels.linkedin && process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN) {
      try {
        await sendLinkedIn({ title, description, url, image }, post.linkedin);
        channels.linkedin = true;
        post.delivery.linkedin = "sent";
        console.log("LinkedIn sent: " + item.slug);
      } catch (error) {
        post.delivery.linkedin = "failed";
        console.error(error.message);
      }
    } else if (channels.linkedin) post.delivery.linkedin = "already-sent";

    state.articles[item.slug] = { fingerprint, channels, lastAttemptAt: new Date().toISOString() };
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
    fs.writeFileSync(path.join(outboxDir, item.slug + ".json"), JSON.stringify(post, null, 2) + "\n");
    results.push({ slug: item.slug, delivery: post.delivery });
  }

  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY || path.join(root, "distribution", "last-run.md"),
    "# Founders Knowledge distribution run\n\n" + results.map(r => "- **" + r.slug + "**: " + (r.status || JSON.stringify(r.delivery))).join("\n") + "\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
