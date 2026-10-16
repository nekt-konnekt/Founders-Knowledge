// Transparent triage heuristic for the private Product Discovery queue.
// This is not an AI verdict and cannot establish originality or verify claims.
export function editorialScore(item = {}) {
  const text = [
    item.location, item.target_users, item.description, item.problem_solved
  ].filter(Boolean).join(" ").toLowerCase();
  const africaPattern = /\b(africa|african|nigeria|kenya|ghana|south africa|rwanda|uganda|tanzania|ethiopia|senegal|cameroon|ivory coast|cote d'ivoire|egypt|morocco|zambia|zimbabwe|namibia|botswana|sierra leone|liberia|malawi|mozambique|angola|congo|benin|togo|gambia|somalia|sudan|algeria|tunisia|libya|mauritius|lesotho|eswatini)\b/;
  const africaFit = africaPattern.test(text) ? 30 : 12;
  const problemLength = String(item.problem_solved || "").trim().length;
  const audienceLength = String(item.target_users || "").trim().length;
  const descriptionLength = String(item.description || "").trim().length;
  const usefulness = Math.min(25, Math.round(
    Math.min(problemLength, 240) / 240 * 12 +
    Math.min(audienceLength, 180) / 180 * 8 +
    Math.min(descriptionLength, 400) / 400 * 5
  ));
  const links = [item.product_website, item.demo_url, item.founder_linkedin].filter(Boolean).length;
  const stage = String(item.product_stage || "").toLowerCase();
  const evidence = Math.min(20, links * 5 + (/launched|revenue|growth|traction|beta|live|customer/.test(stage) ? 5 : 0));
  const specificity = Math.min(15, Math.round(
    Math.min(problemLength, 300) / 300 * 7 +
    Math.min(descriptionLength, 500) / 500 * 8
  ));
  const verification = Math.min(10, links * 3 + (item.demo_url ? 1 : 0));
  const total = Math.min(100, africaFit + usefulness + evidence + specificity + verification);
  const notes = [
    africaFit >= 25 ? "Strong Africa-context signal" : "Confirm relevance to African founders",
    usefulness >= 18 ? "Useful problem and audience detail" : "Clarify the problem and target user",
    evidence >= 10 ? "Some public verification paths available" : "Verify product activity and claims"
  ];
  if (!item.demo_url) notes.push("No demo link supplied");
  return {
    total,
    band: total >= 75 ? "High priority" : total >= 55 ? "Worth reviewing" : "Needs more evidence",
    notes,
    dimensions: { africaFit, usefulness, evidence, specificity, verification }
  };
}
