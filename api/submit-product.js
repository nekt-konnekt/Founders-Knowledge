/**
 * Founders Knowledge — Product Discovery intake
 *
 * Required Vercel environment variables:
 *   NOTION_API_TOKEN — a Notion internal integration token shared with the submissions database
 *   NOTION_DATABASE_ID — Founders Knowledge — Product Submissions database ID
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const origin = req.headers.origin;
  if (origin) {
    try {
      const parsed = new URL(origin);
      const isAllowedHost =
        parsed.hostname === "founders-knowledge.vercel.app" ||
        (parsed.hostname.endsWith(".vercel.app") && parsed.hostname.startsWith("founders-knowledge-"));
      if (parsed.protocol !== "https:" || !isAllowedHost) {
        return res.status(403).json({ error: "This origin is not allowed to submit products." });
      }
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
  }

  const token = process.env.NOTION_API_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return res.status(503).json({
      error: "The submission form is not connected yet. Please check back soon."
    });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  // Quietly accept honeypot submissions without creating review spam.
  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim()) {
    return res.status(200).json({ ok: true });
  }

  const fields = {
    productName: String(body.productName || "").trim(),
    founderName: String(body.founderName || "").trim(),
    email: String(body.email || "").trim(),
    website: String(body.website || "").trim(),
    category: String(body.category || "").trim(),
    stage: String(body.stage || "").trim(),
    location: String(body.location || "").trim(),
    description: String(body.description || "").trim(),
    problem: String(body.problem || "").trim(),
    targetUsers: String(body.targetUsers || "").trim(),
    demo: String(body.demo || "").trim(),
    linkedin: String(body.linkedin || "").trim()
  };

  const required = ["productName", "founderName", "email", "category", "stage", "location", "description", "problem", "targetUsers"];
  if (required.some((key) => !fields[key])) {
    return res.status(400).json({ error: "Please complete all required fields." });
  }
  if (body.consent !== true) {
    return res.status(400).json({ error: "Please confirm the review and contact consent before submitting." });
  }
  if (fields.productName.length > 120 || fields.founderName.length > 120 ||
      fields.email.length > 254 || fields.location.length > 120 ||
      fields.description.length > 280 || fields.problem.length > 2000 ||
      fields.targetUsers.length > 500) {
    return res.status(400).json({ error: "One or more fields exceed the allowed length." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return res.status(400).json({ error: "Please enter a valid contact email." });
  }

  const allowedCategories = ["Commerce", "Finance", "Health", "Logistics", "Learning", "Climate", "Productivity", "Other"];
  const allowedStages = ["Idea", "Prototype", "Beta", "In production", "Launched"];
  if (!allowedCategories.includes(fields.category) || !allowedStages.includes(fields.stage)) {
    return res.status(400).json({ error: "Please choose a valid category and product stage." });
  }

  const safeUrl = (value, label) => {
    if (!value) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      return url.toString();
    } catch {
      throw new Error("Please enter a valid URL for " + label + ".");
    }
  };

  let website, demo, linkedin;
  try {
    website = safeUrl(fields.website, "the product website");
    demo = safeUrl(fields.demo, "the demo link");
    linkedin = safeUrl(fields.linkedin, "the founder LinkedIn profile");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const richText = (value) => ({
    rich_text: [{ type: "text", text: { content: value } }]
  });
  const properties = {
    "Product name": { title: [{ type: "text", text: { content: fields.productName } }] },
    "Review status": { status: { name: "New" } },
    "Founder name": richText(fields.founderName),
    "Contact email": { email: fields.email },
    "Category": { select: { name: fields.category } },
    "Product stage": { select: { name: fields.stage } },
    "Location": richText(fields.location),
    "One-line description": richText(fields.description),
    "Problem solved": richText(fields.problem),
    "Target users": richText(fields.targetUsers),
    "Consent to review": { checkbox: true }
  };
  if (website) properties["Product website"] = { url: website };
  if (demo) properties["Demo link"] = { url: demo };
  if (linkedin) properties["Founder LinkedIn"] = { url: linkedin };

  try {
    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ parent: { database_id: databaseId }, properties })
    });

    if (!notionResponse.ok) {
      const errorBody = await notionResponse.json().catch(() => ({}));
      console.error("Notion submission failed:", notionResponse.status, errorBody.code || "unknown");
      return res.status(502).json({
        error: "We could not add this to the review queue just now. Please try again shortly."
      });
    }

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Product submission request failed:", error.message);
    return res.status(502).json({
      error: "We could not add this to the review queue just now. Please try again shortly."
    });
  }
}
