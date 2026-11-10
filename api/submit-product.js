import pg from "pg";
const { Pool } = pg;
let pool;
function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3, connectionTimeoutMillis: 5000 });
  return pool;
}
const categories = ["Commerce","Finance","Health","Logistics","Learning","Climate","Productivity","Other"];
const stages = ["Idea","Prototype","Beta","In production","Launched"];
const clean = v => String(v ?? "").trim();
function validUrl(value, label) {
  if (!value) return null;
  try { const u = new URL(value); if (u.protocol !== "https:" && u.protocol !== "http:") throw Error(); return u.toString(); }
  catch { throw Error("Please enter a valid URL for " + label + "."); }
}
function validProfileUrl(value, label, domains) {
  const url = validUrl(value, label);
  if (!url) return null;
  const hostname = new URL(url).hostname.toLowerCase();
  if (!domains.some(domain => hostname === domain || hostname.endsWith("." + domain))) {
    throw Error("Please use a " + label + " profile URL.");
  }
  return url;
}
function notionProps(f) {
  const rich = v => ({ rich_text: [{ type: "text", text: { content: v } }] });
  const p = {
    "Product name": { title: [{ type: "text", text: { content: f.productName } }] },
    "Review status": { status: { name: "New" } },
    "Founder name": rich(f.founderName), "Contact email": { email: f.email },
    "Category": { select: { name: f.category } }, "Product stage": { select: { name: f.stage } },
    "Location": rich(f.location), "One-line description": rich(f.description),
    "Problem solved": rich(f.problem), "Target users": rich(f.targetUsers), "Consent to review": { checkbox: true }
  };
  if (f.website) p["Product website"] = { url: f.website };
  if (f.demo) p["Demo link"] = { url: f.demo };
  if (f.linkedin) p["Founder LinkedIn"] = { url: f.linkedin };
  return p;
}
async function syncNotion(id, f) {
  const token = process.env.NOTION_API_TOKEN, databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) return;
  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST", headers: { Authorization: "Bearer " + token, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ parent: { database_id: databaseId }, properties: notionProps(f) }),
      signal: AbortSignal.timeout(4500)
    });
    if (!response.ok) throw Error("Notion HTTP " + response.status);
    const page = await response.json();
    await database().query("UPDATE fk_product_submissions SET notion_sync_status='synced', notion_page_id=$2, updated_at=NOW() WHERE id=$1", [id, page.id]);
  } catch (e) {
    console.error("Notion sync deferred:", e.message);
    await database().query("UPDATE fk_product_submissions SET notion_sync_status='pending', updated_at=NOW() WHERE id=$1", [id]).catch(() => {});
  }
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed." }); }
  const origin = req.headers.origin;
  if (origin) {
    try {
      const u = new URL(origin);
      const allowed = u.protocol === "https:" && (u.hostname === "founders-knowledge.vercel.app" || (u.hostname.endsWith(".vercel.app") && u.hostname.startsWith("founders-knowledge-")));
      if (!allowed) return res.status(403).json({ error: "This origin is not allowed to submit products." });
    } catch { return res.status(403).json({ error: "Invalid request origin." }); }
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};
  if (clean(b.companyWebsite)) return res.status(200).json({ ok: true });
  const f = {
    productName:clean(b.productName), founderName:clean(b.founderName), email:clean(b.email).toLowerCase(),
    website:"", category:clean(b.category), customCategory:clean(b.customCategory), stage:clean(b.stage), location:clean(b.location),
    description:clean(b.description), problem:clean(b.problem), targetUsers:clean(b.targetUsers),
    demo:"", linkedin:"", xProfile:""
  };
  const required = ["productName","founderName","email","category","stage","location","description","problem","targetUsers"];
  if (required.some(k => !f[k])) return res.status(400).json({ error: "Please complete all required fields." });
  if (b.consent !== true) return res.status(400).json({ error: "Please confirm the review and contact consent before submitting." });
  if (f.productName.length>120 || f.founderName.length>120 || f.email.length>254 || f.location.length>120 || f.description.length>280 || f.problem.length>2000 || f.targetUsers.length>500) return res.status(400).json({ error: "One or more fields exceed the allowed length." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return res.status(400).json({ error: "Please enter a valid contact email." });
  if (!categories.includes(f.category) || !stages.includes(f.stage)) return res.status(400).json({ error: "Please choose a valid category and product stage." });
  if (f.category === "Other" && !f.customCategory) return res.status(400).json({ error: "Please specify your product category." });
  if (f.customCategory.length > 80) return res.status(400).json({ error: "Your custom category must be 80 characters or fewer." });
  if (f.category !== "Other") f.customCategory = "";
  try { f.website=validUrl(clean(b.website),"the product website"); f.demo=validUrl(clean(b.demo),"the demo link"); f.linkedin=validProfileUrl(clean(b.linkedin),"LinkedIn",["linkedin.com"]); f.xProfile=validProfileUrl(clean(b.xProfile),"X",["x.com","twitter.com"]); }
  catch (e) { return res.status(400).json({ error: e.message }); }
  try {
    const result = await database().query(
      "INSERT INTO fk_product_submissions (product_name,founder_name,contact_email,product_website,category,custom_category,product_stage,location,description,problem_solved,target_users,demo_url,founder_linkedin,founder_x,consent_to_review,review_status,notion_sync_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE,'New','pending') RETURNING id",
      [f.productName,f.founderName,f.email,f.website,f.category,f.customCategory || null,f.stage,f.location,f.description,f.problem,f.targetUsers,f.demo,f.linkedin,f.xProfile]
    );
    const id = result.rows[0].id;
    await syncNotion(id, f);
    return res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error("Product submission save failed:", e.message);
    if (e.message === "DATABASE_URL is not configured" || e.code === "42P01") return res.status(503).json({ error: "The submission service is being connected. Please try again shortly." });
    return res.status(503).json({ error: "We could not save your submission just now. Please try again shortly." });
  }
}
