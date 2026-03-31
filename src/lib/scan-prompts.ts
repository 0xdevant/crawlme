import type { SeoFacts } from "@/lib/seo-extract";

/** Compact JSON — pretty-print burns prompt tokens with no benefit to the model. */
function factsBlock(facts: SeoFacts): string {
  return JSON.stringify(facts);
}

function competitorFactsBlock(competitors: SeoFacts[]): string {
  return JSON.stringify(competitors);
}

function additionalSiteFactsBlock(pages: SeoFacts[]): string {
  return JSON.stringify(pages);
}

/**
 * Marketing report framing: evidence stays crawl/HTML-only; no invented rankings or ad spend.
 * Bridge to 營銷 by tying search + page UX to acquisition and conversion *without* claiming off-page data.
 */
const MARKETING_REPORT_FOCUS =
  "**Goal:** agency-style **數碼營銷報告** from **HTML + headers only** — scope, evidence-led findings, fixes, verification. " +
  "For **marketing**: SERP/snippet, H1/headings/messaging, trust (HTTPS, schema, security headers), **discoverability + landing effectiveness**; include technical SEO depth (index signals, canonical/robots, links, JSON-LD, image alt). " +
  "Cite PAGE_FACTS fields or say unknown. **Never** invent CWV field data, rankings, backlinks, GSC, ads, crawl budget, social reach. " +
  "Tone: precise, non-hype. Solid basics in facts → **high** `scores` / `overallScore` (often 80–95+); rest = polish. Snapshot audit ≠ Lighthouse SEO score. " +
  "`auditScope`: **香港繁體**, no English disclaimer boilerplate.";

/** Every Chinese string in JSON must be HK Traditional; models often slip into 简体 — forbid explicitly. */
const HK_TRADITIONAL_CHINESE_ONLY =
  "**Chinese (all `seo_scan`, actions, hooks, `competitor_analysis`):** **香港繁體** only — **no 简体** (e.g. 网络、质量、应该、点击、登录). HK: 網絡、質素、應該、點擊、登入；**無須／毋須、編碼** not 无需、编码. " +
  "If PAGE_FACTS use 简体 in title/meta/headings, **rewrite in 繁體** in prose; **≤1** short verbatim quote for evidence. No mixed 繁+简 in one sentence. JSON keys: camelCase English. ";

/** When facts show weak sectioning, recommend more H2/H3 — evidence-led. */
const HEADING_STRUCTURE_GUIDANCE =
  "**Headings:** if facts show too few H2/H3 vs long copy, recommend more subheadings — cite `headingCounts`/`h1`/`h2`; no invented quotes. Compare competitors only via COMPETITOR JSON. ";

const COMPETITOR_MINDSET =
  "If COMPETITOR_PAGE_FACTS non-empty: compare **on-page** positioning (title/meta/H1), schema, headings, tech signals — **not** SERP/backlinks/ads. Empty competitors → `competitor_analysis` null. ";

/** Avoid empty `competitor_themes: []` while `primary_themes` is full — confusing in UI. */
const INFERRED_TOPIC_THEMES_RULE =
  "**`inferred_topic_themes` (paid, competitors present):** `primary_themes` + `competitor_themes` = **2–5** HK phrases each from title/H1/meta/headings/schema in JSON. **Never** `competitor_themes: []` if `primary_themes` non-empty — infer, omit key, or one HK note (e.g. 對手字極少) + `limitations`. ";

/**
 * Stops generic “any website” steps (e.g. `<img src="image-url" alt="…">`) — every fix must tie to THIS crawl.
 */
const SITE_SPECIFIC_IMPLEMENTATION_RULES =
  "**`preview_actions` / `full_actions` / `steps`:** tie every `title`, `rationale`, `steps[].text` to **this crawl** — cite PAGE_FACTS (`title`, `h1`, `metaDescription`, `canonical`, `headingCounts`, `imagesMissingAlt`/`imagesTotal`, headers, schema, etc.). Say what's wrong + fix; **no** generic tutorials. " +
  "**Forbidden:** placeholders (`example.com`, `image-url`, stock meta/img). **Omit `snippet`** unless grounded in facts; for images use counts + section from headings, not fake `<img>`. " +
  "**Expandables:** `detail` must add value beyond `text` (no empty paraphrase; if `imagesMissingAlt` is 0, no fake alt-tweak expandables). With `snippet`, start `detail` with **「貼上位置：」/「適用位置：」** (file, header name, or DOM). **Do not** duplicate `snippet` text inside `detail` body.";

/**
 * Keeps scope honest without sounding like a legal disclaimer; model must follow this for `seo_scan.auditScope`.
 */
function auditScopeInstruction(hasAdditionalPages: boolean): string {
  const extra = hasAdditionalPages
    ? " Mention **sampled** same-site URLs (not full crawl). "
    : "";
  return (
    "`seo_scan.auditScope` — **香港繁體**, **1–2 sentences**: inputs = HTML+headers for submitted URL" +
    extra +
    "; competitors only if COMPETITOR_PAGE_FACTS non-empty. One line on what stakeholders can act on. " +
    "**No** long exclusion lists, English boilerplate, or repeating this in `executiveSummary`/`summary`."
  );
}

/** JSON shape for `seo_scan` — camelCase only in model output. */
const SEO_SCAN_SHAPE_FREE =
  "`seo_scan` (camelCase): `executiveSummary` (2–3 sentences, stakeholder, 商業/獲客風險 + evidence). " +
  "`auditScope` per rule below. `overallScore` 0–100 **required** (aligns with `scores`). " +
  "`scores`: title, meta, headings, content, technical each 0–100 (SERP title/meta, headings, depth+links, tech+schema+alts). " +
  "`summary` 4–7 sentences — **no** duplicate opening vs `executiveSummary`; deeper evidence only. " +
  "`strengths` string[] max 3. `priorityFindings` max 4 `{ priority, finding, evidence? }` P0=blockers P1=impact P2=polish; omit empty `evidence`. " +
  "`verificationChecklist` max 4. `bullets` max 6 (non-duplicative).";

const SEO_SCAN_SHAPE_PAID =
  "`seo_scan` same as free but: `strengths` ≤4, `priorityFindings` ≤8, `verificationChecklist` ≤8, `bullets` ≤10, `summary` 5–10 sentences — **no** duplicate exec opening.";

export function buildFreeScanPrompt(
  primary: SeoFacts,
  competitors: SeoFacts[],
  additionalSitePages: SeoFacts[] = [],
): Array<{ role: "system" | "user"; content: string }> {
  const hasComp = competitors.length > 0;
  const hasBreadth = additionalSitePages.length > 0;
  return [
    {
      role: "system",
      content:
        "Senior **digital marketing + technical SEO** strategist; **營銷報告** from crawled HTML. " +
        (hasBreadth
          ? "With ADDITIONAL_SAME_SITE_PAGE_FACTS: cross-page patterns (titles/metas/links/thin dup) — PRIMARY stays anchor. "
          : "") +
        MARKETING_REPORT_FOCUS +
        " " +
        COMPETITOR_MINDSET +
        " " +
        SITE_SPECIFIC_IMPLEMENTATION_RULES +
        " " +
        HK_TRADITIONAL_CHINESE_ONLY +
        HEADING_STRUCTURE_GUIDANCE +
        " JSON only. **Free tier:** 3× `preview_actions` (evidence-based search/landing fixes; `title`, `rationale`, `impact?`, **steps** 3–6 objects: `text`, optional `detail`/`snippet` plain text). Site-specific only. " +
        "3× `pro_teaser_actions` (`title`, `impact`, `hook` one line) — different titles from previews; no steps/snippets.",
    },
    {
      role: "user",
      content:
        "**營銷導向審計** (search + landing + tech) of PRIMARY from facts below. " +
        (hasBreadth ? "ADDITIONAL_* = sampled breadth, not full crawl. " : "") +
        (hasComp ? "COMPETITOR_* → `competitor_analysis`. " : "") +
        "Return JSON with keys: " +
        SEO_SCAN_SHAPE_FREE +
        "`preview_actions` (3, steps required), " +
        "`pro_teaser_actions` (exactly 3 objects: title, impact high|medium|low, hook string — one-line teaser only), " +
        (hasComp
          ? "`competitor_analysis` (object: methodology_limits string; snapshot_summary string; " +
            "top_gaps string array max 4 technical/content gaps vs competitors; differentiation_hooks string array max 3 **SEO / 定位 / 訊息** angles visible from snapshots). "
          : "`competitor_analysis` null. ") +
        "\n\nPRIMARY_PAGE_FACTS:\n" +
        factsBlock(primary) +
        "\n\nADDITIONAL_SAME_SITE_PAGE_FACTS (same schema; empty array if none — extra pages on the same host sampled via links from the primary page):\n" +
        additionalSiteFactsBlock(additionalSitePages) +
        "\n\nCOMPETITOR_PAGE_FACTS (same schema per entry; empty array if none):\n" +
        competitorFactsBlock(competitors) +
        "\n\n" +
        auditScopeInstruction(hasBreadth) +
        "\n\n**Keys:** `seo_scan`, `preview_actions`, `pro_teaser_actions`, `competitor_analysis` (object|null). " +
        "Every preview step maps to PRIMARY_PAGE_FACTS. **香港繁體** only.",
    },
  ];
}

export function buildPaidScanPrompt(
  primary: SeoFacts,
  competitors: SeoFacts[],
  additionalSitePages: SeoFacts[] = [],
): Array<{ role: "system" | "user"; content: string }> {
  const hasComp = competitors.length > 0;
  const hasBreadth = additionalSitePages.length > 0;
  return [
    {
      role: "system",
      content:
        "Senior **digital marketing + technical SEO** consultant; paid **營銷／growth** deliverable, evidence-led. " +
        (hasBreadth
          ? "ADDITIONAL_*: cross-page backlog where facts support (templates, dup titles, links). "
          : "") +
        MARKETING_REPORT_FOCUS +
        " " +
        COMPETITOR_MINDSET +
        (hasComp ? " " + INFERRED_TOPIC_THEMES_RULE + " " : "") +
        SITE_SPECIFIC_IMPLEMENTATION_RULES +
        " " +
        HK_TRADITIONAL_CHINESE_ONLY +
        HEADING_STRUCTURE_GUIDANCE +
        " Respond with JSON only (no markdown).",
    },
    {
      role: "user",
      content:
        "**營銷導向** audit: backlog for marketing/content/engineering. " +
        (hasBreadth ? "ADDITIONAL_* = sampled breadth. " : "") +
        (hasComp ? "Competitors: on-page marketing+tech compare. " : "") +
        "Return JSON with keys: " +
        SEO_SCAN_SHAPE_PAID +
        "`full_actions` (10–18): title, impact, effort, `steps` as objects with `text`; optional `detail`/`snippet` (plain text, facts-grounded; omit generic snippets). Order by impact×feasibility. " +
        (hasComp ? "Mention competitors only if it sharpens a fix. " : "") +
        "`conversion_notes`: implementation+QA (crawl/index/schema/links/security; messaging when facts support). " +
        "`preview_actions` (exactly 3): title, rationale, impact?, **steps** 3–6 objects — align with `full_actions` where applicable. " +
        (hasComp
          ? "`competitor_analysis` (object: methodology_limits string; executive_summary string; " +
            "positioning_matrix (array of: competitor_url, their_inferred_positioning, your_inferred_positioning, strategic_takeaway), " +
            "inferred_topic_themes (primary_themes, competitor_themes), " +
            "content_gaps (gap_description, what_competitor_does, what_you_should_do), " +
            "differentiation_opportunities string array, limitations string). "
          : "`competitor_analysis` null. ") +
        "\n\nPRIMARY_PAGE_FACTS:\n" +
        factsBlock(primary) +
        "\n\nADDITIONAL_SAME_SITE_PAGE_FACTS (same schema; empty array if none):\n" +
        additionalSiteFactsBlock(additionalSitePages) +
        "\n\nCOMPETITOR_PAGE_FACTS (same schema per entry; empty array if none):\n" +
        competitorFactsBlock(competitors) +
        "\n\n" +
        auditScopeInstruction(hasBreadth) +
        "\n\nMap actions to PRIMARY_PAGE_FACTS (or additional/competitor when used). **香港繁體** only.",
    },
  ];
}
