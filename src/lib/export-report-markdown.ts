import type { PageSpeedInsightsPayload } from "@/lib/pagespeed-insights";
import { normalizeSeoScanForUi } from "@/lib/seo-scan-normalize";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

type ScanExport = {
  seo_scan?: unknown;
  preview_actions?: Array<{
    title?: string;
    rationale?: string;
    impact?: string;
    steps?: unknown;
  }>;
  full_actions?: unknown;
  competitor_analysis?: unknown;
  pagespeed_insights?: unknown;
  site_crawl?: {
    total_pages: number;
    extra_requested: number;
    pages: Array<{ url: string; ok: boolean; error?: string }>;
  };
};

function parseStep(raw: unknown): { text: string; detail?: string } | null {
  if (typeof raw === "string") {
    const t = raw.trim();
    return t ? { text: t } : null;
  }
  if (!isRecord(raw)) return null;
  const text =
    (typeof raw.text === "string" && raw.text.trim()) ||
    (typeof raw.instruction === "string" && raw.instruction.trim()) ||
    (typeof raw.step === "string" && raw.step.trim()) ||
    "";
  if (!text) return null;
  const detail =
    typeof raw.detail === "string" && raw.detail.trim()
      ? raw.detail.trim()
      : typeof raw.note === "string" && raw.note.trim()
        ? raw.note.trim()
        : undefined;
  return { text, detail };
}

function push(lines: string[], s: string) {
  lines.push(s);
}

/**
 * Many Markdown renderers treat `<title>` as raw HTML. Wrap tag-shaped fragments in inline
 * code so they show literally as `<title>`. Skips matches immediately after `` ` `` (already
 * inside inline code from the model).
 */
function wrapHtmlTagSnippetsInInlineCode(s: string): string {
  const re = /<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s[^>]*)?>/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const start = m.index;
    const match = m[0];
    const before = start > 0 ? s[start - 1] : "";
    if (before === "`") {
      out += s.slice(last, start + match.length);
      last = start + match.length;
      continue;
    }
    out += s.slice(last, start) + "`" + match + "`";
    last = start + match.length;
  }
  out += s.slice(last);
  return out;
}

const md = wrapHtmlTagSnippetsInInlineCode;

/** Fenced code block — avoids breaking if `detail` contains ``` by using a longer fence when needed. */
function pushFencedBlock(lines: string[], body: string) {
  const trimmed = body.trimEnd();
  let fence = "```";
  while (trimmed.includes(fence)) {
    fence += "`";
  }
  push(lines, fence);
  push(lines, trimmed);
  push(lines, fence);
}

function appendCompetitorAnalysisMarkdown(lines: string[], raw: unknown) {
  push(lines, "## 競爭對手分析");
  push(lines, "");
  if (raw == null) return;

  if (!isRecord(raw)) {
    push(lines, md(String(raw)));
    push(lines, "");
    return;
  }

  const data = raw;

  const exec =
    typeof data.executive_summary === "string" ? data.executive_summary.trim() : "";
  const snap =
    typeof data.snapshot_summary === "string" ? data.snapshot_summary.trim() : "";
  const limFrom =
    typeof data.limitations === "string" ? data.limitations.trim() : "";
  const methFrom =
    typeof data.methodology_limits === "string"
      ? data.methodology_limits.trim()
      : "";
  const limitations = limFrom || methFrom || "";

  const topGaps = Array.isArray(data.top_gaps)
    ? data.top_gaps.filter(
        (x): x is string =>
          typeof x === "string" && x.trim().length > 0,
      )
    : [];
  const hooks = Array.isArray(data.differentiation_hooks)
    ? data.differentiation_hooks.filter(
        (x): x is string =>
          typeof x === "string" && x.trim().length > 0,
      )
    : [];
  const diffOpp = Array.isArray(data.differentiation_opportunities)
    ? data.differentiation_opportunities.filter(
        (x): x is string =>
          typeof x === "string" && x.trim().length > 0,
      )
    : [];

  const positioningMatrix = Array.isArray(data.positioning_matrix)
    ? data.positioning_matrix
    : [];
  const contentGaps = Array.isArray(data.content_gaps) ? data.content_gaps : [];
  const topicThemes = isRecord(data.inferred_topic_themes)
    ? data.inferred_topic_themes
    : null;

  if (
    !exec &&
    !snap &&
    !limitations &&
    !topGaps.length &&
    !hooks.length &&
    !diffOpp.length &&
    !positioningMatrix.length &&
    !contentGaps.length &&
    !topicThemes
  ) {
    push(lines, "_（呢一部分未有可解析嘅結構化內容。）_");
    push(lines, "");
    return;
  }

  if (exec) {
    push(lines, md(exec));
    push(lines, "");
  }
  if (snap) {
    push(lines, md(snap));
    push(lines, "");
  }

  if (topicThemes) {
    const primaryList = (
      Array.isArray(topicThemes.primary_themes) ? topicThemes.primary_themes : []
    ).filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
    const competitorList = (
      Array.isArray(topicThemes.competitor_themes)
        ? topicThemes.competitor_themes
        : []
    ).filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
    if (primaryList.length || competitorList.length) {
      push(lines, "### 主題線索");
      push(lines, "");
      if (primaryList.length) {
        push(lines, "**你嘅頁面**");
        push(lines, "");
        for (const t of primaryList) {
          push(lines, `- ${md(t)}`);
        }
        push(lines, "");
      }
      if (competitorList.length) {
        push(lines, "**競爭對手**");
        push(lines, "");
        for (const t of competitorList) {
          push(lines, `- ${md(t)}`);
        }
        push(lines, "");
      }
    }
  }

  if (positioningMatrix.length > 0) {
    push(lines, "### 同對手比：各自點樣定位");
    push(lines, "");
    let i = 0;
    for (const row of positioningMatrix) {
      if (!isRecord(row)) continue;
      i += 1;
      const compUrlRaw =
        typeof row.competitor_url === "string" ? row.competitor_url.trim() : "";
      let compUrl = compUrlRaw;
      try {
        if (compUrl) compUrl = new URL(compUrl).toString();
      } catch {
        /* keep */
      }
      push(lines, `#### ${i}. ${md(compUrl || "（未有網址）")}`);
      push(lines, "");
      if (typeof row.their_inferred_positioning === "string" && row.their_inferred_positioning.trim()) {
        push(lines, `- **對方定位**：${md(row.their_inferred_positioning.trim())}`);
      }
      if (typeof row.your_inferred_positioning === "string" && row.your_inferred_positioning.trim()) {
        push(lines, `- **你嘅定位**：${md(row.your_inferred_positioning.trim())}`);
      }
      if (typeof row.strategic_takeaway === "string" && row.strategic_takeaway.trim()) {
        push(lines, `- **要點**：${md(row.strategic_takeaway.trim())}`);
      }
      push(lines, "");
    }
  }

  if (contentGaps.length > 0) {
    push(lines, "### 內容／頁面上可以補嘅位");
    push(lines, "");
    let j = 0;
    for (const row of contentGaps) {
      if (!isRecord(row)) continue;
      j += 1;
      if (typeof row.gap_description === "string" && row.gap_description.trim()) {
        push(lines, `**${j}.** ${md(row.gap_description.trim())}`);
        push(lines, "");
      }
      if (typeof row.what_competitor_does === "string" && row.what_competitor_does.trim()) {
        push(lines, `- 對手做法：${md(row.what_competitor_does.trim())}`);
      }
      if (typeof row.what_you_should_do === "string" && row.what_you_should_do.trim()) {
        push(lines, `- 你可以做：${md(row.what_you_should_do.trim())}`);
      }
      push(lines, "");
    }
  }

  if (topGaps.length > 0) {
    push(lines, "### 比起對手，你仲可以加強嘅地方");
    push(lines, "");
    for (const g of topGaps) {
      push(lines, `- ${md(g)}`);
    }
    push(lines, "");
  }

  if (hooks.length > 0 || diffOpp.length > 0) {
    if (hooks.length > 0) {
      push(lines, "### 點樣突出自己、同對手唔同");
      push(lines, "");
      for (const h of hooks) {
        push(lines, `- ${md(h)}`);
      }
      push(lines, "");
    }
    if (diffOpp.length > 0) {
      push(lines, "### 可以點樣做得更唔同");
      push(lines, "");
      for (const h of diffOpp) {
        push(lines, `- ${md(h)}`);
      }
      push(lines, "");
    }
  }

  if (limitations) {
    push(lines, `_方法／限制：${md(limitations)}_`);
    push(lines, "");
  }
}

/** Plain-text / Markdown report — no dependencies; open in any editor or VS Code. */
export function buildScanReportMarkdown(
  result: ScanExport,
  opts: { analyzedUrl: string },
): string {
  const lines: string[] = [];
  push(lines, "# 營銷分析報告");
  push(lines, "");
  push(lines, `- **匯出時間**：${new Date().toLocaleString("zh-HK", { hour12: false })}`);
  push(lines, `- **分析頁面**：${opts.analyzedUrl}`);
  push(lines, "");

  const sc = result.site_crawl;
  if (sc) {
    push(lines, "## 掃描範圍");
    push(lines, "");
    push(
      lines,
      `- 同站頁面：**${sc.total_pages}**（額外請求 ${sc.extra_requested}）`,
    );
    push(lines, "");
  }

  const psi = result.pagespeed_insights as PageSpeedInsightsPayload | undefined;
  if (psi && !psi.error && psi.scores) {
    const s = psi.scores;
    push(lines, "## PageSpeed（實驗室｜手機）");
    push(lines, "");
    push(
      lines,
      `| 效能 | 無障礙 | 最佳實踐 | SEO |\n| --- | --- | --- | --- |\n| ${s.performance ?? "—"} | ${s.accessibility ?? "—"} | ${s.bestPractices ?? "—"} | ${s.seo ?? "—"} |`,
    );
    push(lines, "");
  }

  const seo = normalizeSeoScanForUi(result.seo_scan);
  if (seo) {
    push(lines, "## 營銷審計摘要");
    push(lines, "");
    if (seo.overallScore !== null) {
      push(lines, `**報告總分**：${seo.overallScore}／100`);
      push(lines, "");
    }
    if (seo.executiveSummary) {
      push(lines, md(seo.executiveSummary));
      push(lines, "");
    }
    if (seo.auditScope) {
      push(lines, `**審計範圍**：${md(seo.auditScope)}`);
      push(lines, "");
    }
    if (seo.summary) {
      push(lines, md(seo.summary));
      push(lines, "");
    }
    if (seo.strengths.length) {
      push(lines, "### 可持續強化／優勢");
      push(lines, "");
      for (const t of seo.strengths) {
        push(lines, `- ${md(t)}`);
      }
      push(lines, "");
    }
    if (seo.priorityFindings.length) {
      push(lines, "### 優先要點");
      push(lines, "");
      for (const row of seo.priorityFindings) {
        const ev = row.evidence
          ? ` _（${md(row.evidence)}）_`
          : "";
        push(lines, `- **${row.priority}** ${md(row.finding)}${ev}`);
      }
      push(lines, "");
    }
    if (seo.bullets.length) {
      for (const b of seo.bullets) {
        push(lines, `- ${md(b)}`);
      }
      push(lines, "");
    }
    if (seo.verificationChecklist.length) {
      push(lines, "### 驗證清單");
      push(lines, "");
      for (const c of seo.verificationChecklist) {
        push(lines, `- [ ] ${md(c)}`);
      }
      push(lines, "");
    }
  }

  const previews = result.preview_actions;
  if (Array.isArray(previews) && previews.length > 0) {
    push(lines, "## 建議先睇");
    push(lines, "");
    for (const a of previews) {
      if (a.title) {
        push(lines, `### ${md(a.title)}`);
        push(lines, "");
      }
      if (a.impact) {
        push(lines, `_影響：${md(a.impact)}_`);
        push(lines, "");
      }
      if (a.rationale) {
        push(lines, md(a.rationale));
        push(lines, "");
      }
    }
  }

  const full = result.full_actions;
  if (Array.isArray(full) && full.length > 0) {
    push(lines, "## 完整行動清單");
    push(lines, "");
    for (const item of full) {
      if (!isRecord(item)) continue;
      const title = typeof item.title === "string" ? item.title : "行動";
      const impact = typeof item.impact === "string" ? item.impact : "";
      const effort = typeof item.effort === "string" ? item.effort : "";
      const meta = [
        impact && `影響：${md(impact)}`,
        effort && `工作量：${md(effort)}`,
      ]
        .filter(Boolean)
        .join("；");
      push(lines, `### ${md(title)}`);
      push(lines, "");
      if (meta) {
        push(lines, `_${meta}_`);
        push(lines, "");
      }
      const steps = item.steps;
      if (Array.isArray(steps)) {
        const parsed = steps
          .map(parseStep)
          .filter((s): s is NonNullable<typeof s> => s !== null);
        const multi = parsed.length > 1;
        let j = 0;
        for (const st of parsed) {
          j += 1;
          push(
            lines,
            multi ? `${j}. ${md(st.text)}` : md(st.text),
          );
          if (st.detail) {
            push(lines, "");
            pushFencedBlock(lines, st.detail);
          }
          push(lines, "");
        }
      }
    }
  }

  if (result.competitor_analysis != null) {
    appendCompetitorAnalysisMarkdown(lines, result.competitor_analysis);
  }

  return lines.join("\n");
}

function safeFilenameSegment(s: string): string {
  const t = s.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return t.slice(0, 48) || "report";
}

/** Browser-only: trigger a `.md` download. */
export function downloadMarkdownReport(
  content: string,
  urlHintForName: string,
): void {
  if (typeof window === "undefined") return;
  let host = "report";
  try {
    const t = urlHintForName.trim();
    if (t) {
      host = safeFilenameSegment(new URL(t.startsWith("http") ? t : `https://${t}`).hostname);
    }
  } catch {
    /* */
  }
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `insights-${host}-${stamp}.md`;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(href);
}
