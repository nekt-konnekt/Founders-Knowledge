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

function makeXPost(title, description, url) {
  const maxText = 280;
  const suffix = "\n\n" + url;
  const prefix = title + "\n\n";
  const room = Math.max(40, maxText - prefix.length - suffix.length - 3);
  const summary = description.length > room ? description.slice(0, room - 1).trimEnd() + "…" : description;
  return prefix + summary + suffix;
}

function percentEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function oauth1Signature(method, url, params, consumerSecret, tokenSecret) {
  const parameterString = params
    .map(([key, value]) => [percentEncode(key), percentEncode(value)])
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0) : (a[0] < b[0] ? -1 : 1)))
    .map(([key, value]) => key + "=" + value)
    .join("&");
  const baseString = method.toUpperCase() + "&" + percentEncode(url) + "&" + percentEncode(parameterString);
  const signingKey = percentEncode(consumerSecret) + "&" + percentEncode(tokenSecret);
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

function oauth1AuthorizationHeader(method, url, credentials) {
  const oauthParams = [
    ["oauth_consumer_key", credentials.consumerKey],
    ["oauth_nonce", crypto.randomBytes(16).toString("hex")],
    ["oauth_signature_method", "HMAC-SHA1"],
    ["oauth_timestamp", Math.floor(Date.now() / 1000).toString()],
    ["oauth_token", credentials.accessToken],
    ["oauth_version", "1.0"]
  ];
  const parsed = new URL(url);
  const signingParams = [...oauthParams];
  for (const [key, value] of parsed.searchParams) signingParams.push([key, value]);
  const signature = oauth1Signature(method, parsed.origin + parsed.pathname, signingParams,
    credentials.consumerSecret, credentials.accessTokenSecret);
  const headerParams = [...oauthParams, ["oauth_signature", signature]]
    .map(([key, value]) => [percentEncode(key), percentEncode(value)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return "OAuth " + headerParams.map(([key, value]) => key + '="' + value + '"').join(", ");
}

function getXCredentials() {
  const consumerKey = process.env.X_API_CLIENT_ID;
  const consumerSecret = process.env.X_API_CLIENT_SECRET;
  const packedToken = process.env.X_API_REFRESH_TOKEN;
  if (!consumerKey || !consumerSecret || !packedToken) {
    throw new Error("X publishing requires X_API_CLIENT_ID, X_API_CLIENT_SECRET, and X_API_REFRESH_TOKEN.");
  }
  // The X channel uses OAuth 1.0a user-context credentials, which never expire
  // or rotate. The existing repository values are reused with new meanings:
  // X_API_CLIENT_ID carries the Consumer Key, X_API_CLIENT_SECRET the Consumer
  // Secret, and X_API_REFRESH_TOKEN the user token pair joined by a single
  // colon: "<Access Token>:<Access Token Secret>".
  const separator = packedToken.indexOf(":");
  if (separator <= 0 || separator === packedToken.length - 1) {
    throw new Error("X configuration error: X_API_REFRESH_TOKEN must contain the OAuth 1.0a access token and access token secret joined by a single colon (\"<Access Token>:<Access Token Secret>\").");
  }
  return {
    consumerKey,
    consumerSecret,
    accessToken: packedToken.slice(0, separator),
    accessTokenSecret: packedToken.slice(separator + 1)
  };
}

async function sendXPost(text) {
  const credentials = getXCredentials();
  const url = "https://api.twitter.com/2/tweets";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauth1AuthorizationHeader("POST", url, credentials),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.data?.id) {
    throw new Error("X delivery failed (" + response.status + "): " + JSON.stringify(body).slice(0, 500));
  }
  return { configured: true, postId: body.data.id };
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

function redditUserAgent() {
  const username = process.env.REDDIT_USERNAME || "unknown";
  return "FoundersKnowledgeDistribution/1.0 (by /u/" + username + ")";
}

function redditConfigured() {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET &&
    process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD);
}

function redditTargets() {
  const subs = (process.env.REDDIT_SUBREDDITS || "").split(",")
    .map(value => value.trim().replace(/^\/?r\//i, "").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
  if (subs.length) return [...new Set(subs)];
  // No subreddits configured: post to the account's own profile.
  return ["u_" + process.env.REDDIT_USERNAME];
}

async function getRedditAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Reddit publishing requires REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, and REDDIT_PASSWORD.");
  }

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": redditUserAgent()
    },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error("Reddit token request failed (" + response.status + "): " + JSON.stringify(body).slice(0, 400));
  }
  console.log("Reddit OAuth 2.0 access token obtained successfully.");
  return body.access_token;
}

async function sendRedditPost(token, target, title, text) {
  const response = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": redditUserAgent()
    },
    body: new URLSearchParams({
      api_type: "json",
      kind: "self",
      sr: target,
      title,
      text,
      resubmit: "false",
      sendreplies: "true"
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error("Reddit delivery to " + target + " failed (" + response.status + "): " + JSON.stringify(body).slice(0, 500));
  }
  const errors = body?.json?.errors || [];
  if (errors.length) {
    throw new Error("Reddit delivery to " + target + " failed: " + JSON.stringify(errors).slice(0, 500));
  }
  return { postId: body?.json?.data?.id || null, url: body?.json?.data?.url || null };
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
      x: makeXPost(title, description, url),
      linkedin: postText + "\n\n#FoundersKnowledge #AfricanTech #Startups",
      telegram: postText,
      reddit: description + "\n\nWhat should founders take away from this? Read the full analysis from Founders Knowledge.\n\n" + url,
      createdAt: new Date().toISOString(),
      delivery: { linkedin: "pending", telegram: "pending" }
    };
    fs.writeFileSync(path.join(outboxDir, item.slug + ".json"), JSON.stringify(post, null, 2) + "\n");

    const enabled = Boolean(process.env.X_API_REFRESH_TOKEN && process.env.X_API_CLIENT_ID && process.env.X_API_CLIENT_SECRET) ||
      Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_AUTHOR_URN) ||
      Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) ||
      redditConfigured();
    if (!enabled) {
      console.log("No distribution credentials configured. Draft pack written for " + item.slug + ".");
      results.push({ slug: item.slug, status: "draft-only" });
      continue;
    }

    await waitForLiveArticle(url);

    if (!channels.x && process.env.X_API_REFRESH_TOKEN && process.env.X_API_CLIENT_ID && process.env.X_API_CLIENT_SECRET) {
      try {
        const result = await sendXPost(post.x);
        channels.x = true;
        post.delivery.x = "sent";
        console.log("X post sent: " + item.slug + " (" + result.postId + ")");
      } catch (error) {
        post.delivery.x = "failed";
        console.error(error.message);
      }
    } else if (channels.x) post.delivery.x = "already-sent";

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

    if (redditConfigured()) {
      // Reddit posts once per target (each configured subreddit, or the account's
      // own profile when none are configured). State tracks each target separately
      // so a retry only attempts the targets that have not already succeeded.
      const sentTargets = channels.reddit && typeof channels.reddit === "object" ? { ...channels.reddit } : {};
      const pendingTargets = redditTargets().filter(target => !sentTargets[target]);
      if (!pendingTargets.length) {
        post.delivery.reddit = "already-sent";
      } else {
        try {
          const redditToken = await getRedditAccessToken();
          const failures = [];
          for (const target of pendingTargets) {
            try {
              const result = await sendRedditPost(redditToken, target, title, post.reddit);
              sentTargets[target] = true;
              console.log("Reddit sent: " + item.slug + " -> " + target + " (" + (result.postId || "confirmed") + ")");
            } catch (error) {
              failures.push(error.message);
              console.error(error.message);
            }
          }
          if (Object.keys(sentTargets).length) channels.reddit = sentTargets;
          if (!failures.length) post.delivery.reddit = "sent";
          else if (Object.keys(sentTargets).length) post.delivery.reddit = "partial";
          else post.delivery.reddit = "failed";
        } catch (error) {
          post.delivery.reddit = "failed";
          console.error(error.message);
        }
      }
    }

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
