import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const lessonsDir = path.join(root, "lessons");
const outputDir = path.join(root, "assets", "og", "lessons");
const site = "https://founders-knowledge.vercel.app";
fs.mkdirSync(outputDir, { recursive: true });

function readMeta(html, key, attr = "property") {
  const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp("<meta\\\\s+" + attr + "=[\\"']" + escaped + "[\\"']\\\\s+content=[\\"']([^\\"']*)[\\"'][^>]*>", "i");
  const alt = new RegExp("<meta\\\\s+content=[\\"']([^\\"']*)[\\"']\\\\s+" + attr + "=[\\"']" + escaped + "[\\"'][^>]*>", "i");
  return (html.match(re) || html.match(alt) || [,""])[1];
}
function esc(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function wrap(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (next.length > maxChars && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:!?-]*$/, "") + "…";
  }
  return lines;
}
function textLines(lines, x, y, lineHeight, size, color, weight, family) {
  return '<text x="' + x + '" y="' + y + '" fill="' + color + '" font-family="' + family + '" font-size="' + size + '" font-weight="' + weight + '">' +
    lines.map((line, i) => '<tspan x="' + x + '" dy="' + (i ? lineHeight : 0) + '">' + esc(line) + '</tspan>').join("") + '</text>';
}
function cardSvg(title, description) {
  const titleLines = wrap(title, 28, 4);
  const descLines = wrap(description, 39, 3);
  const titleSize = title.length > 62 ? 43 : title.length > 42 ? 49 : 56;
  const descY = Math.min(150 + titleLines.length * (titleSize + 7) + 25, 455);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">' +
'<title id="title">' + esc(title) + '</title><desc id="desc">' + esc(description) + '</desc>' +
'<rect width="1200" height="630" rx="30" fill="#f3ecff"/><rect x="18" y="18" width="1164" height="594" rx="24" fill="none" stroke="#1a0f2e" stroke-width="4"/>' +
'<circle cx="76" cy="74" r="26" fill="#fde047" stroke="#1a0f2e" stroke-width="3"/><text x="76" y="82" text-anchor="middle" fill="#1a0f2e" font-family="Fredoka,Arial,sans-serif" font-size="22" font-weight="700">FK</text>' +
'<text x="118" y="70" fill="#1a0f2e" font-family="Fredoka,Arial,sans-serif" font-size="25" font-weight="600">Founders Knowledge</text><text x="118" y="98" fill="#786d8e" font-family="Space Grotesk,Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="2">A FOUNDER FIELD NOTE</text>' +
textLines(titleLines, 62, 176, titleSize + 7, titleSize, "#1a0f2e", 700, "Fredoka,Arial,sans-serif") +
textLines(descLines, 64, descY, 31, 22, "#45375d", 500, "Space Grotesk,Arial,sans-serif") +
'<rect x="62" y="535" width="250" height="48" rx="12" fill="#8b5cf6" stroke="#1a0f2e" stroke-width="3"/><text x="187" y="565" text-anchor="middle" fill="#ffffff" font-family="Fredoka,Arial,sans-serif" font-size="18" font-weight="600">READ THE LESSON ↗</text>' +
'<g transform="translate(690 140) rotate(-7 200 180)"><rect x="0" y="0" width="365" height="330" rx="28" fill="#ffffff" stroke="#1a0f2e" stroke-width="5"/><text x="30" y="48" fill="#45375d" font-family="Space Grotesk,Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="2">THE QUESTION</text>' +
textLines(wrap(title, 19, 4), 30, 105, 42, 30, "#1a0f2e", 700, "Fredoka,Arial,sans-serif") +
'<rect x="30" y="263" width="220" height="12" rx="6" fill="#e5d8ff"/><rect x="30" y="286" width="275" height="12" rx="6" fill="#e5d8ff"/></g>' +
'<g transform="translate(810 300) rotate(5 160 125)"><rect x="0" y="0" width="330" height="235" rx="27" fill="#fde047" stroke="#1a0f2e" stroke-width="5"/><text x="27" y="42" fill="#45375d" font-family="Space Grotesk,Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="2">THE TAKEAWAY</text>' +
textLines(wrap(description, 20, 3), 27, 91, 36, 25, "#1a0f2e", 700, "Fredoka,Arial,sans-serif") +
'<rect x="27" y="183" width="270" height="12" rx="6" fill="#fffdf9" stroke="#1a0f2e" stroke-width="2"/></g>' +
'<path d="M650 490 C700 550 740 550 790 520" fill="none" stroke="#c4b5fd" stroke-width="5" stroke-dasharray="8 8"/>' +
'<rect x="920" y="90" width="165" height="54" rx="27" fill="#fbcfe8" stroke="#1a0f2e" stroke-width="3" transform="rotate(8 1000 117)"/><text x="1002" y="112" text-anchor="middle" fill="#1a0f2e" font-family="Fredoka,Arial,sans-serif" font-size="14" font-weight="700" transform="rotate(8 1002 112)">BUILD WITH</text><text x="1002" y="130" text-anchor="middle" fill="#1a0f2e" font-family="Fredoka,Arial,sans-serif" font-size="14" font-weight="700" transform="rotate(8 1002 130)">MORE CLARITY</text></svg>';
}
function replaceMeta(html, key, value) {
  const escaped = key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp('(<meta\\\\s+(?:property|name)=["\\']' + escaped + '["\\']\\\\s+content=["\\'])[^"\\']*(["\\'][^>]*>)', "i");
  if (re.test(html)) return html.replace(re, "$1" + value + "$2");
  return html.replace(/<\\/head>/i, '  <meta property="' + key + '" content="' + value + '">\n</head>');
}
const entries = fs.readdirSync(lessonsDir, { withFileTypes: true }).filter(e => e.isDirectory());
let updated = 0;
for (const entry of entries) {
  const slug = entry.name;
  const htmlPath = path.join(lessonsDir, slug, "index.html");
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, "utf8");
  const title = (readMeta(html, "og:title") || (html.match(/<title>([^<]+)<\\/title>/i) || [,""])[1] || slug).replace(/\\s*[—|]\\s*Founders Knowledge\\s*$/i, "").trim();
  const description = readMeta(html, "og:description") || readMeta(html, "description", "name") || "Practical knowledge for founders building useful products and businesses.";
  const svg = cardSvg(title, description);
  const hash = crypto.createHash("sha256").update(svg).digest("hex").slice(0, 10);
  fs.writeFileSync(path.join(outputDir, slug + ".svg"), svg);
  const source = site + "/assets/og/lessons/" + slug + ".svg";
  const imageUrl = "https://wsrv.nl/?url=" + encodeURIComponent(source) + "&output=png&w=1200&h=630&fit=cover&maxage=1y&v=" + hash;
  html = replaceMeta(html, "og:image", imageUrl);
  html = replaceMeta(html, "twitter:image", imageUrl);
  fs.writeFileSync(htmlPath, html);
  updated++;
}
console.log("Generated " + updated + " Founders Knowledge lesson preview cards.");
