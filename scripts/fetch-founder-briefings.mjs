#!/usr/bin/env node

/**
 * Fetch public RSS/Atom feeds and turn new items into reviewable static briefing pages.
 * No item is published outside the branch/PR created by GitHub Actions until a reviewer merges it.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCES_FILE = path.join(ROOT, "data/startup-news-sources.json");
const OUTPUT_DIR = path.join(ROOT, "briefings");
const STATE_FILE = path.join(ROOT, "data/startup-news-seen.json");
const SITE_ORIGIN = "https://founders-knowledge.vercel.app";
const MAX_PER_SOURCE = Number(process.env.MAX_PER_SOURCE || 4);
const DRY_RUN = process.env.DRY_RUN === "1";

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const stripHtml = (value = "") => String(value)
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, " ")
  .trim();

const decodeXml = (value = "") => stripHtml(String(value)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"))
  .trim();

const tag = (xml, name) => {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
};

const allBlocks = (xml, name) => [...xml.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "gi"))].map((m) => m[1]);

const firstUrl = (block) => {
  const atom = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  const rss = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return (atom?.[1] || rss?.[1] || "").trim();
};

const slugify = (value) => decodeXml(value)
  .toLowerCase()
  .replace(/https?:\/\/[^\s]+/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 80) || "founder-briefing";

const dateStamp = (value) => {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const formatDate = (value) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric"
}).format(new Date(value));

const topicFor = (item, source) => {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const rules = [
    ["ai", /\b(ai|artificial intelligence|model|agent)\b/],
    ["funding", /\b(fund|series [a-d]|seed|venture|investment|raised|acqui)\b/],
    ["product", /\b(product|launch|release|feature|build|software)\b/],
    ["distribution", /\b(growth|market|customer|sales|distribution|marketing)\b/],
    ["operators", /\b(hiring|team|culture|operations|operator|leadership)\b/]
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || source.topics?.[0] || "founders";
};

const founderAngle = (item, topic) => {
  const angles = {
    ai: "Track the capability shift, then ask which founder workflow becomes cheaper, faster, or newly possible.",
    funding: "Funding is a signal, not a strategy. Watch what the capital enables and whether customer pull supports it.",
    product: "The useful question is not what launched, but which customer problem the change makes easier to solve.",
    distribution: "Look past the announcement for the route to customers, the learning loop, and the constraint it addresses.",
    operators: "Translate the update into an operating question: what should a small team change, test, or stop doing?",
    founders: "Use the update as a prompt to test an assumption in your own business rather than as a reason to copy a headline."
  };
  return angles[topic] || angles.founders;
};

const parseFeed = (xml, source) => {
  const blocks = [...allBlocks(xml, "item"), ...allBlocks(xml, "entry")];
  return blocks.slice(0, MAX_PER_SOURCE).map((block) => {
    const title = tag(block, "title");
    const link = firstUrl(block);
    const description = tag(block, "description") || tag(block, "summary") || tag(block, "content");
    const published = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const topic = topicFor({ title, description }, source);
    return {
      id: link || `${source.id}:${title}`,
      title: title || "Untitled startup update",
      link,
      description: description.slice(0, 700),
      published: dateStamp(published),
      source: source.name,
      sourceId: source.id,
      topic,
      angle: founderAngle({ title, description }, topic)
    };
  }).filter((item) => item.title && item.link);
};

const briefingHtml = (item) => {
  const canonical = `${SITE_ORIGIN}/briefings/${slugify(item.title)}/`;
  const excerpt = item.description || "A startup update selected for its practical relevance to founders and operators.";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(excerpt.slice(0, 155))}">
  <meta name="theme-color" content="#f3ecff">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>${escapeHtml(item.title)} — Founder Briefing</title>
  <link rel="canonical" href="${canonical}">
  <meta property="og:site_name" content="Founders Knowledge">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(item.title)} — Founder Briefing">
  <meta property="og:description" content="${escapeHtml(excerpt.slice(0, 155))}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="/assets/site.css">
</head>
<body class="lesson-page briefing-page">
  <a class="skip-link" href="#briefing-content">Skip to briefing</a>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Founders Knowledge home"><span class="brand-mark" aria-hidden="true">FK</span><span class="brand-name">Founders <b>Knowledge</b></span></a>
    <nav aria-label="Briefing navigation"><a href="/library/">All knowledge</a><a href="/briefings/">Founder briefings</a></nav>
    <a class="nav-cta" href="/briefings/">Latest briefings</a>
  </header>
  <main id="briefing-content">
    <section class="lesson-hero">
      <a class="lesson-back" href="/briefings/">Back to founder briefings</a>
      <div class="lesson-cover briefing-cover">
        <div class="lesson-cover-copy">
          <p class="lesson-kicker"><span class="lesson-kicker-dot"></span> FOUNDER BRIEFING <span class="lesson-separator">/</span> ${escapeHtml(item.topic.toUpperCase())}</p>
          <h1>${escapeHtml(item.title)}</h1>
          <p class="lesson-dek">A concise startup update with a practical angle for founders and operators.</p>
          <div class="lesson-meta"><span>${escapeHtml(formatDate(item.published))}</span><span>${escapeHtml(item.source)}</span></div>
        </div>
        <div class="lesson-cover-art briefing-art" aria-hidden="true"><div class="lesson-art-spark spark-one">✳</div><div class="lesson-art-card art-current"><span class="art-label">THE UPDATE</span><strong>Signal<br>or noise?</strong></div><div class="lesson-art-card art-better"><span class="art-label">THE FOUNDER ANGLE</span><strong>Make the next move explicit.</strong></div></div>
      </div>
    </section>
    <div class="lesson-layout">
      <aside class="lesson-sidebar" aria-label="On this page"><div class="lesson-sidebar-inner"><p class="sidebar-label">IN THIS BRIEFING</p><a href="#what-happened">01 <span>What happened</span></a><a href="#why-care">02 <span>Why founders should care</span></a><a href="#source">03 <span>Read the source</span></a></div></aside>
      <article class="lesson-body">
        <div class="lesson-opening"><span class="opening-mark">“</span><p>${escapeHtml(excerpt)}</p></div>
        <section id="what-happened" class="lesson-section"><p class="section-number">01 — WHAT HAPPENED</p><h2>The signal in the update.</h2><p>${escapeHtml(excerpt)}</p></section>
        <section id="why-care" class="lesson-section"><p class="section-number">02 — WHY FOUNDERS SHOULD CARE</p><h2>Turn the headline into a useful question.</h2><div class="lesson-callout callout-yellow"><span class="callout-icon">!</span><div><strong>Founder angle</strong><p>${escapeHtml(item.angle)}</p></div></div><p>This briefing is an editorial starting point, not a substitute for reading the original reporting. Keep the facts, assumptions, and implications separate.</p></section>
        <section id="source" class="lesson-exercise"><p class="section-number">03 — GO DEEPER</p><h2>Read the original source.</h2><p>Review the reporting in full, then decide whether the signal changes a decision, experiment, or operating habit in your own context.</p><a class="button button-primary" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(item.source)} ↗</a></section>
        <div class="lesson-takeaway"><span class="takeaway-label">THE TAKEAWAY</span><p>Good startup news should help you <em>see the next decision more clearly.</em></p></div>
      </article>
    </div>
  </main>
  <footer class="site-footer"><a class="brand" href="/" aria-label="Founders Knowledge home"><span class="brand-mark" aria-hidden="true">FK</span><span class="brand-name">Founders <b>Knowledge</b></span></a><p>Built by founders, for founders.</p><a class="back-top" href="#briefing-content">Back to top</a></footer>
</body>
</html>
`;
};

const readJson = async (file, fallback) => existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : fallback;

const main = async () => {
  const sources = await readJson(SOURCES_FILE, []);
  const seen = await readJson(STATE_FILE, {});
  const created = [];
  for (const source of sources) {
    try {
      const response = await fetch(source.url, { headers: { "user-agent": "FoundersKnowledgeBriefings/1.0" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const items = parseFeed(await response.text(), source);
      for (const item of items) {
        if (seen[item.id]) continue;
        const slug = slugify(item.title);
        const outputDir = path.join(OUTPUT_DIR, slug);
        if (existsSync(path.join(outputDir, "index.html"))) continue;
        created.push({ ...item, slug });
        seen[item.id] = { slug, firstSeen: new Date().toISOString() };
        if (!DRY_RUN) {
          await mkdir(outputDir, { recursive: true });
          await writeFile(path.join(outputDir, "index.html"), briefingHtml(item));
        }
      }
    } catch (error) {
      console.warn(`[source warning] ${source.name}: ${error.message}`);
    }
  }
  if (!DRY_RUN) await writeFile(STATE_FILE, `${JSON.stringify(seen, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `created=${created.length}\n`, { flag: "a" });
  }
  console.log(JSON.stringify({ created: created.length, items: created }, null, 2));
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
