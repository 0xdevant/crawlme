import type { SeoFacts } from "@/lib/seo-extract";

function factsBlock(facts: SeoFacts): string {
  return JSON.stringify(facts, null, 2);
}

/** Shared: primary lens = sales & marketing conversion; SEO signals support discoverability and clarity. */
const CONVERSION_FOCUS =
  "Primary goal: help the visitor become a lead or customer (sign up, book, buy, contact). " +
  "Prioritize messaging, value proposition, trust, social proof, CTAs, objections, friction on the path to conversion. " +
  "Use on-page facts (title, meta, headings, body copy, links, schema hints) to infer marketing/sales effectiveness. " +
  "Secondary: technical and SEO hygiene that affects trust, speed, or clarity—do not lead with keyword rankings.";

export function buildFreeScanPrompt(facts: SeoFacts): Array<{ role: "system" | "user"; content: string }> {
  return [
    {
      role: "system",
      content:
        "You are an expert conversion (CRO) and marketing strategist who uses on-page evidence from a single-URL crawl. " +
        CONVERSION_FOCUS +
        " Respond with JSON only (no markdown). Recommendations are suggestions, not guarantees. " +
        "The user has NOT paid: output exactly 3 short preview_actions (teasers) focused on conversion/sales impact, not a full backlog.",
    },
    {
      role: "user",
      content:
        "Analyze this single-page snapshot. Frame seo_scan around how well the page supports conversion and revenue-related goals (not generic SEO audits). " +
        "Return JSON with keys: " +
        "`seo_scan` (object with: overallScore 0-100 weighted toward conversion readiness, " +
        "scores object with keys title, meta, headings, content, technical each 0-100 where: " +
        "title = clarity/relevance for the intended buyer; meta = promise and click appeal; headings = persuasion structure; " +
        "content = value prop, proof, offer clarity; technical = barriers to trust or speed), " +
        "summary string, bullets string array max 6 emphasizing sales/marketing fixes first), " +
        "`preview_actions` (exactly 3 objects with title and rationale strings; each must tie to leads, trust, CTAs, messaging, or friction). " +
        "Facts JSON follows.\n\n" +
        factsBlock(facts),
    },
  ];
}

export function buildPaidScanPrompt(facts: SeoFacts): Array<{ role: "system" | "user"; content: string }> {
  return [
    {
      role: "system",
      content:
        "You are an expert conversion (CRO), sales-enablement, and marketing consultant. " +
        CONVERSION_FOCUS +
        " Respond with JSON only (no markdown). Recommendations are suggestions, not guarantees.",
    },
    {
      role: "user",
      content:
        "Analyze this single-page crawl snapshot. Prioritize actions that increase qualified leads, purchases, or demo/contact intent. " +
        "Return JSON with keys: " +
        "`seo_scan` (same shape as free: overallScore, scores with title/meta/headings/content/technical as defined for conversion-weighted meaning, summary, bullets), " +
        "`full_actions` (array of 8-15 prioritized objects: title, impact: low|medium|high, effort: low|medium|high, " +
        "owner: marketing|dev|content|design|sales, steps: string array; order by conversion impact), " +
        "`conversion_notes` (string: concrete guidance on messaging, offer clarity, trust, CTAs, objections, social proof, and funnel friction—not generic SEO tips). " +
        "Facts JSON follows.\n\n" +
        factsBlock(facts),
    },
  ];
}
