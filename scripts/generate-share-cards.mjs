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
    const values = attributes(match[0]);
    if ((values[attr] || "").toLowerCase() === key.toLowerCase()) return values.content || "";
  }
  return "";
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

function titleSvg(title) {
  // Keep the title legible and constrain the card to five lines maximum.
  let maxChars = 34;
  let lines = wrap(title, maxChars);
  while (lines.length > 5 && maxChars < 52) {
    maxChars += 2;
    lines = wrap(title, maxChars);
  }

  const size = lines.length <= 2 ? 62 : lines.length <= 3 ? 54 : lines.length <= 4 ? 46 : 40;
  const lineHeight = Math.round(size * 1.18);
  const totalHeight = size + (lines.length - 1) * lineHeight;
  const firstY = Math.max(210, Math.round(370 - totalHeight / 2 + size * 0.78));
  const titleLines = lines.map((line, index) =>
    '<tspan x="64" dy="' + (index === 0 ? 0 : lineHeight) + '">' + esc(line) + "</tspan>"
  ).join("");

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="' + esc(title) + '">' +
    '<rect width="1200" height="630" fill="#ffffff"/>' +
    '<rect x="64" y="44" width="42" height="42" rx="8" fill="#6d3be8"/>' +
    '<text x="85" y="73" text-anchor="middle" fill="#ffffff" font-family="Space Grotesk, Arial, Helvetica, sans-serif" font-size="19" font-weight="700">FK</text>' +
    '<text x="120" y="73" fill="#171717" font-family="Space Grotesk, Arial, Helvetica, sans-serif" font-size="25" font-weight="700">Founders Knowledge</text>' +
    '<text x="64" y="' + firstY + '" fill="#171717" font-family="Space Grotesk, Arial, Helvetica, sans-serif" font-size="' + size + '" font-weight="700" letter-spacing="-1.4">' + titleLines + '</text>' +
    '</svg>';
}

function replaceMeta(html, key, value) {
  let replaced = false;
  const output = html.replace(/<meta\b[^>]*>/gi, tag => {
    const values = attributes(tag);
    if (!replaced && (
      (values.property || "").toLowerCase() === key.toLowerCase() ||
      (values.name || "").toLowerCase() === key.toLowerCase()
    )) {
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

const entries = fs.readdirSync(lessonsDir, { withFileTypes: true }).filter(entry => entry.isDirectory());
let updated = 0;
const failures = [];

for (const entry of entries) {
  const slug = entry.name;
  const htmlPath = path.join(lessonsDir, slug, "index.html");
  if (!fs.existsSync(htmlPath)) continue;

  let html = fs.readFileSync(htmlPath, "utf8");
  const rawTitle = readMeta(html, "og:title") ||
    ((html.match(/<title>([^<]+)<\/title>/i) || [, ""])[1]) || slug;
  const title = rawTitle.replace(/\s*[—|]\s*Founders Knowledge\s*$/i, "").trim();
  const svg = titleSvg(title);
  const hash = crypto.createHash("sha256").update(svg).digest("hex").slice(0, 10);
  fs.writeFileSync(path.join(outputDir, slug + ".svg"), svg);

  const source = site + "/assets/og/lessons/" + slug + ".svg";
  const imageUrl = "https://wsrv.nl/?url=" + encodeURIComponent(source) +
    "&output=png&w=1200&h=630&fit=cover&maxage=1y&v=" + hash;

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
  console.log("Generated and validated " + updated + " minimalist branded Open Graph cards (FK + Founders Knowledge + bold lesson title).");
}
