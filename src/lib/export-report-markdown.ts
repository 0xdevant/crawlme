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
  conversion_notes?: unknown;
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
      push(lines, seo.executiveSummary);
      push(lines, "");
    }
    if (seo.auditScope) {
      push(lines, `**審計範圍**：${seo.auditScope}`);
      push(lines, "");
    }
    if (seo.summary) {
      push(lines, seo.summary);
      push(lines, "");
    }
    if (seo.strengths.length) {
      push(lines, "### 可持續強化／優勢");
      push(lines, "");
      for (const t of seo.strengths) {
        push(lines, `- ${t}`);
      }
      push(lines, "");
    }
    if (seo.priorityFindings.length) {
      push(lines, "### 優先要點");
      push(lines, "");
      for (const row of seo.priorityFindings) {
        const ev = row.evidence ? ` _（${row.evidence}）_` : "";
        push(lines, `- **${row.priority}** ${row.finding}${ev}`);
      }
      push(lines, "");
    }
    if (seo.bullets.length) {
      for (const b of seo.bullets) {
        push(lines, `- ${b}`);
      }
      push(lines, "");
    }
    if (seo.verificationChecklist.length) {
      push(lines, "### 驗證清單");
      push(lines, "");
      for (const c of seo.verificationChecklist) {
        push(lines, `- [ ] ${c}`);
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
        push(lines, `### ${a.title}`);
        push(lines, "");
      }
      if (a.impact) {
        push(lines, `_影響：${a.impact}_`);
        push(lines, "");
      }
      if (a.rationale) {
        push(lines, a.rationale);
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
      const meta = [impact && `影響：${impact}`, effort && `工作量：${effort}`]
        .filter(Boolean)
        .join("；");
      push(lines, `### ${title}`);
      push(lines, "");
      if (meta) {
        push(lines, `_${meta}_`);
        push(lines, "");
      }
      const steps = item.steps;
      if (Array.isArray(steps)) {
        let j = 0;
        for (const raw of steps) {
          const st = parseStep(raw);
          if (!st) continue;
          j += 1;
          push(lines, `${j}. ${st.text}`);
          if (st.detail) {
            push(lines, "");
            push(lines, st.detail);
          }
          push(lines, "");
        }
      }
    }
  }

  if (result.competitor_analysis != null) {
    push(lines, "## 競爭對手分析");
    push(lines, "");
    push(lines, "```json");
    push(
      lines,
      JSON.stringify(result.competitor_analysis, null, 2).slice(0, 14_000),
    );
    push(lines, "```");
    push(lines, "");
  }

  if (result.conversion_notes != null) {
    push(lines, "## 轉化備註");
    push(lines, "");
    if (typeof result.conversion_notes === "string") {
      push(lines, result.conversion_notes);
    } else {
      push(lines, "```json");
      push(lines, JSON.stringify(result.conversion_notes, null, 2).slice(0, 8_000));
      push(lines, "```");
    }
    push(lines, "");
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
