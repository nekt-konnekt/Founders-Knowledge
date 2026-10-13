import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const lessonsDir = path.join(root, "lessons");
const outputDir = path.join(root, "assets", "og", "lessons");
const site = "https://founders-knowledge.vercel.app";
fs.mkdirSync(outputDir, { recursive: true });

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*(["'])(.*?)\2/g)) {
    result[match[1].toLowerCase()] = match[3];
  }
  return result;
}
function readMeta(html, key, attr = "property") {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attributes(match[0]);
    if ((a[attr] || "").toLowerCase() === key.toLowerCase()) return a.content || "";
  }
  return "";
}
function esc(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function wrap(text, maxChars) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["Founders Knowledge"];
}
function firstBodyHighlight(html) {
  const opening = html.match(/<div\\b[^>]*class=["'][^"']*lesson-opening[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>/i);
  const body = opening ? opening[1] : ((html.match(/<article\\b[^>]*class=["'][^"']*lesson-body[^"']*["'][^>]*>([\\s\\S]*?)<\\/article>/i) || [])[1] || "");
  const paragraphs = [...body.matchAll(/<p\\b[^>]*>([\\s\\S]*?)<\\/p>/gi)]
    .map(match => match[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&ldquo;|&rdquo;|&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/\\s+/g, " ").trim())
    .filter(text => text.length >= 60);
  return paragraphs[0] || "";
}
function highlightSvg(highlight) {
  const maxChars = highlight.length > 250 ? 36 : highlight.length > 180 ? 40 : 44;
  const lines = wrap(highlight, maxChars);
  const size = lines.length <= 3 ? 52 : lines.length <= 4 ? 44 : lines.length <= 5 ? 38 : 32;
  const lineHeight = Math.round(size * 1.2);
  const totalHeight = size + (lines.length - 1) * lineHeight;
  const startY = Math.max(175, Math.round((600 - totalHeight) / 2 + size * 0.78));
  const tspans = lines.map((line, i) =>
    '<tspan x="64" dy="' + (i === 0 ? 0 : lineHeight) + '">' + esc(line) + '</tspan>'
  ).join("");
  return '<?xml version="1.0" encoding="UTF-8"?>\\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="' + esc(highlight) + '">' +
    '<rect width="1200" height="630" fill="#ffffff"/>' +
    '<image href="https://founders-knowledge.vercel.app/favicon.svg" x="64" y="42" width="42" height="42"/>' +
    '<text x="120" y="71" fill="#202124" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">Founders Knowledge</text>' +
    '<text x="64" y="' + startY + '" fill="#202124" font-family="Arial, Helvetica, sans-serif" font-size="' + size + '" font-weight="700">' + tspans + '</text>' +
    '</svg>';
}
function replaceMeta(html, key, value) {
  let replaced = false;
  const output = html.replace(/<meta\b[^>]*>/gi, tag => {
    const a = attributes(tag);
    if (!replaced && ((a.property || "").toLowerCase() === key.toLowerCase() || (a.name || "").toLowerCase() === key.toLowerCase())) {
      replaced = true;
      return /content\s*=\s*(["']).*?\1/i.test(tag)
        ? tag.replace(/content\s*=\s*(["']).*?\1/i, 'content="' + value + '"')
        : tag.replace(/\s*\/?\s*>$/, ' content="' + value + '">');
    }
    return tag;
  });
  if (replaced) return output;
  return output.replace(/<\/head>/i, '  <meta property="' + key + '" content="' + value + '">\n</head>');
}

const entries = fs.readdirSync(lessonsDir, { withFileTypes: true }).filter(e => e.isDirectory());
let updated = 0;
const failures = [];
for (const entry of entries) {
  const slug = entry.name;
  const htmlPath = path.join(lessonsDir, slug, "index.html");
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, "utf8");
  const rawTitle = readMeta(html, "og:title") || ((html.match(/<title>([^<]+)<\/title>/i) || [, ""])[1]) || slug;
  const title = rawTitle.replace(/\s*[—|]\s*Founders Knowledge\s*$/i, "").trim();
  const svg = titleSvg(title);
  const hash = crypto.createHash("sha256").update(svg).digest("hex").slice(0, 10);
  fs.writeFileSync(path.join(outputDir, slug + ".svg"), svg);
  const source = site + "/assets/og/lessons/" + slug + ".svg";
  const imageUrl = "https://wsrv.nl/?url=" + encodeURIComponent(source) + "&output=png&w=1200&h=630&fit=cover&maxage=1y&v=" + hash;
  for (const key of ["og:image", "og:image:secure_url", "twitter:image"]) {
    html = replaceMeta(html, key, imageUrl);
  }
  html = replaceMeta(html, "twitter:card", "summary_large_image");
  const values = [
    readMeta(html, "og:image"),
    readMeta(html, "og:image:secure_url"),
    readMeta(html, "twitter:image", "name")
  ];
  if (values.some(value => value !== imageUrl)) failures.push(slug + ": image metadata is inconsistent");
  fs.writeFileSync(htmlPath, html);
  updated++;
}
if (failures.length) {
  console.error("Share-card metadata validation failed:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Generated and validated " + updated + " body-highlight Founders Knowledge previews with the logo and name in the upper-left.");
}
