import type { SeoFacts } from "@/lib/seo-extract";
import { slimSeoFactsForVenicePrompt } from "@/lib/seo-facts-prompt";

/** Compact JSON — pretty-print burns prompt tokens with no benefit to the model. */
function factsBlock(facts: SeoFacts): string {
  return JSON.stringify(slimSeoFactsForVenicePrompt(facts));
}

function competitorFactsBlock(competitors: SeoFacts[]): string {
  return JSON.stringify(competitors.map(slimSeoFactsForVenicePrompt));
}

function additionalSiteFactsBlock(pages: SeoFacts[]): string {
  return JSON.stringify(pages.map(slimSeoFactsForVenicePrompt));
}

/** Evidence = crawl/HTML only; no invented off-page metrics. */
const MARKETING_REPORT_FOCUS =
  "**Goal:** **數碼營銷報告** from **HTML + headers only** — scope, evidence-led findings, fixes. " +
  "Cover: SERP/snippet, H1/headings/messaging, trust (HTTPS, schema, security headers), discoverability + landing; technical SEO (index signals, canonical/robots, links, JSON-LD, image alt). " +
  "Cite PAGE_FACTS or say unknown. **Never** invent CWV field values, rankings, backlinks, GSC, ads, crawl budget, social reach. " +
  "Tone: precise, non-hype. Solid facts → high `scores`/`overallScore` (often 80–95+). Snapshot audit ≠ Lighthouse SEO score.";

const HK_TRADITIONAL_AND_PROSE =
  "**Chinese (seo_scan, actions, hooks, competitor_analysis):** **香港繁體** only — **no 简体**; rewrite source 简体 in facts to 繁體 (≤1 short quote for evidence). JSON keys: camelCase English. " +
  "**書面語:** short sentences, one main point each; gloss terms on first mention (LCP、JSON-LD、canonical); concrete fixes not vague「優化」; `executiveSummary`≠`summary` opening; readable by a non-engineer marketer.";

/** On-page compare + heading advice (evidence-led). */
const ON_PAGE_COMPETITOR_AND_HEADINGS =
  "If COMPETITOR_PAGE_FACTS non-empty: compare **on-page** only (title/meta/H1, schema, headings, tech) — not SERP/backlinks/ads; else `competitor_analysis` null. " +
  "If few H2/H3 vs long copy, recommend subheadings — cite `headingCounts`/h1/h2; no invented quotes.";

const INFERRED_TOPIC_THEMES_RULE =
  "**`inferred_topic_themes` (paid, competitors):** `primary_themes` + `competitor_themes` = **2–5** HK phrases each from JSON title/H1/meta/headings/schema. **Never** `competitor_themes: []` when `primary_themes` non-empty — infer, omit key, or HK note (e.g. 對手字極少) + `limitations`.";

const SITE_SPECIFIC_IMPLEMENTATION_RULES =
  "**`preview_actions` / `full_actions` / `steps`:** tie to **this crawl** via PAGE_FACTS (title, h1, metaDescription, canonical, headingCounts, imagesMissingAlt/imagesTotal, headers, schema); issue + fix; no generic tutorials. " +
  "No placeholders (example.com, image-url). Omit `snippet` unless factual; images: counts + heading context, not fake `<img>`. " +
  "`detail` must add beyond `text` (skip fake alt tweaks if `imagesMissingAlt` is 0). With `snippet`, start `detail` with **「貼上位置：」/「適用位置：」**; do not duplicate `snippet` inside `detail`.";

function auditScopeInstruction(hasAdditionalPages: boolean): string {
  const extra = hasAdditionalPages ? " Note sampled same-site URLs (not full crawl). " : "";
  return (
    "`seo_scan.auditScope`: **香港繁體**, **1–2 sentences** — HTML+headers for submitted URL" +
    extra +
    "; competitors only if COMPETITOR_PAGE_FACTS non-empty; what stakeholders can act on. " +
    "No long exclusion lists, English boilerplate, or repeating this in `executiveSummary`/`summary`."
  );
}

const SEO_SCAN_SHAPE_FREE =
  "`seo_scan`: `executiveSummary` (2–3 sentences, 書面語, risk + evidence); `auditScope` per rule below; `overallScore` 0–100 (align `scores`); " +
  "`scores` title|meta|headings|content|technical each 0–100; `summary` 4–7 sentences, **no** duplicate opening vs `executiveSummary`; " +
  "`strengths` ≤3 strings; `priorityFindings` ≤4 {priority,finding,evidence?} P0|P1|P2; `verificationChecklist` ≤4; `bullets` ≤6.";

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
          ? "ADDITIONAL_SAME_SITE_PAGE_FACTS: cross-page patterns (titles/metas/links/dup) — PRIMARY anchor. "
          : "") +
        MARKETING_REPORT_FOCUS +
        " " +
        ON_PAGE_COMPETITOR_AND_HEADINGS +
        " " +
        SITE_SPECIFIC_IMPLEMENTATION_RULES +
        " " +
        HK_TRADITIONAL_AND_PROSE +
        " JSON only — **one** root `{…}` object; no prose before `{`. **Free:** 3× `preview_actions` (`title`, `rationale`, `impact?`, **steps** 3–6×{`text`, optional `detail`/`snippet`}). " +
        "3× `pro_teaser_actions` (`title`, `impact`, `hook` one line) — titles ≠ previews; no steps/snippets.",
    },
    {
      role: "user",
      content:
        "**營銷導向審計** (search + landing + tech) from PRIMARY below. " +
        (hasBreadth ? "ADDITIONAL_* = sampled breadth. " : "") +
        (hasComp ? "COMPETITOR_* → `competitor_analysis`. " : "") +
        "Return JSON: " +
        SEO_SCAN_SHAPE_FREE +
        " `preview_actions` (3, steps required); `pro_teaser_actions` (3×: title, impact high|medium|low, hook one line); " +
        (hasComp
          ? "`competitor_analysis` { methodology_limits, snapshot_summary, top_gaps[]≤4, differentiation_hooks[]≤3 (SEO/定位/訊息 from snapshots) }. "
          : "`competitor_analysis` null. ") +
        "\n\nPRIMARY_PAGE_FACTS:\n" +
        factsBlock(primary) +
        "\n\nADDITIONAL_SAME_SITE_PAGE_FACTS (same schema; [] if none):\n" +
        additionalSiteFactsBlock(additionalSitePages) +
        "\n\nCOMPETITOR_PAGE_FACTS (same schema; [] if none):\n" +
        competitorFactsBlock(competitors) +
        "\n\n" +
        auditScopeInstruction(hasBreadth) +
        "\n\nRoot keys: `seo_scan`, `preview_actions`, `pro_teaser_actions`, `competitor_analysis`. Preview steps → PRIMARY_PAGE_FACTS.",
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
        (hasBreadth ? "ADDITIONAL_*: cross-page backlog when facts support. " : "") +
        MARKETING_REPORT_FOCUS +
        " " +
        ON_PAGE_COMPETITOR_AND_HEADINGS +
        (hasComp ? " " + INFERRED_TOPIC_THEMES_RULE + " " : "") +
        SITE_SPECIFIC_IMPLEMENTATION_RULES +
        " " +
        HK_TRADITIONAL_AND_PROSE +
        " JSON only (no markdown). **One** root `{…}` object; no prose before `{`.",
    },
    {
      role: "user",
      content:
        "**營銷導向** audit — backlog for marketing/content/engineering. " +
        (hasBreadth ? "ADDITIONAL_* = sampled breadth. " : "") +
        (hasComp ? "Competitors: on-page compare only. " : "") +
        "Return JSON: " +
        SEO_SCAN_SHAPE_PAID +
        " `full_actions` (10–18): title, priority P0|P1|P2, impact, effort, steps[{`text`, optional `detail`/`snippet`}]; facts-grounded; order impact×feasibility; align P* with `priorityFindings`. " +
        (hasComp ? "Reference competitors only if it sharpens a fix. " : "") +
        "`conversion_notes`: implementation + QA (crawl/index/schema/links/security; messaging when facts support). " +
        "`preview_actions` (3): align with `full_actions` where applicable. " +
        (hasComp
          ? "`competitor_analysis` { methodology_limits, executive_summary, positioning_matrix: [{competitor_url, their_inferred_positioning, your_inferred_positioning, strategic_takeaway}], " +
            "inferred_topic_themes: {primary_themes, competitor_themes}, content_gaps: [{gap_description, what_competitor_does, what_you_should_do}], differentiation_opportunities[], limitations }. "
          : "`competitor_analysis` null. ") +
        "\n\nPRIMARY_PAGE_FACTS:\n" +
        factsBlock(primary) +
        "\n\nADDITIONAL_SAME_SITE_PAGE_FACTS (same schema; [] if none):\n" +
        additionalSiteFactsBlock(additionalSitePages) +
        "\n\nCOMPETITOR_PAGE_FACTS (same schema; [] if none):\n" +
        competitorFactsBlock(competitors) +
        "\n\n" +
        auditScopeInstruction(hasBreadth) +
        "\n\nGround actions in PRIMARY_PAGE_FACTS (or additional/competitor when used).",
    },
  ];
}
