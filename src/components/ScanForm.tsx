"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useEffect, useMemo, useState } from "react";
import { THREADS_PROFILE_URL } from "@/lib/threads-constants";

type ScanResponse = {
  error?: string;
  upgrade?: boolean;
  paid?: boolean;
  seo_scan?: unknown;
  preview_actions?: Array<{ title?: string; rationale?: string }>;
  full_actions?: unknown;
  conversion_notes?: unknown;
  facts?: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cfRay?: string;
    headers?: Record<string, string>;
  };
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function ScanForm() {
  const [url, setUrl] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d: { paid?: boolean }) => setPaid(!!d.paid))
      .catch(() => setPaid(false));
  }, []);

  const needsTurnstile = Boolean(turnstileSiteKey);

  const canSubmit = useMemo(() => {
    if (!url.trim()) return false;
    if (needsTurnstile && !turnstileToken) return false;
    return true;
  }, [needsTurnstile, turnstileToken, url]);

  const runScan = useCallback(async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body: { url: string; turnstileToken?: string } = { url: url.trim() };
      if (needsTurnstile && turnstileToken) body.turnstileToken = turnstileToken;

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ScanResponse & { upgrade?: boolean };
      if (!res.ok) {
        if (res.status === 429 && data.upgrade) {
          setError(null);
          setResult({ ...data, paid: false });
          return;
        }
        setError(data.error ?? `請求失敗（${res.status}）`);
        return;
      }
      setResult(data);
      if (typeof data.paid === "boolean") setPaid(data.paid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "網絡錯誤");
    } finally {
      setLoading(false);
    }
  }, [needsTurnstile, turnstileToken, url]);

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "無法開始結帳");
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "結帳失敗");
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const showThreadsBanner = paid !== true;

  return (
    <div className="flex flex-col gap-10">
      {showThreadsBanner ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          <span className="text-white/85">鐘意 CrawlMe？</span>
          <a
            href={THREADS_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-violet-300 underline decoration-violet-400/40 underline-offset-2 transition hover:text-violet-200"
          >
            喺 Threads 追蹤 @pls.clawify
          </a>
          <span className="text-white/50">睇更新同貼士。</span>
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur">
        <div className="flex flex-col gap-4">
          <label className="text-sm text-white/70" htmlFor="url">
            網站網址
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none ring-amber-400/30 placeholder:text-white/30 focus:border-amber-400/50 focus:ring-2"
            />
            <button
              type="button"
              disabled={!canSubmit || loading}
              onClick={() => void runScan()}
              className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "分析中…" : "分析轉化與營銷"}
            </button>
          </div>
          {needsTurnstile ? (
            <div className="pt-2">
              <Turnstile
                siteKey={turnstileSiteKey as string}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>
          ) : null}
          <p className="text-xs text-white/45">
            免費版按 IP 設每日掃描上限。升級可解鎖完整優先清單同轉化筆記。
          </p>
        </div>
      </section>

      {paid === true ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Pro 已啟用 — 每次分析都會顯示完整行動清單同轉化筆記。
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">解鎖完整優先清單</p>
            <p className="text-sm text-white/55">每月 US$24 — 優先修復、CRO 筆記同可匯出嘅行動項目。</p>
          </div>
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={checkoutLoading}
            className="rounded-xl border border-amber-400/40 bg-transparent px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/10 disabled:opacity-40"
          >
            {checkoutLoading ? "轉跳緊…" : "訂閱"}
          </button>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {result?.upgrade ? (
        <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
          你已達到呢個網絡嘅每日免費掃描上限。可以聽日再試，或者訂閱解鎖完整報告。
        </div>
      ) : null}

      {result && !result.error && !result.upgrade ? (
        <section className="grid gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">轉化與營銷分析</h2>
            <pre className="font-mono mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/50 p-4 text-xs leading-relaxed text-white/80">
              {JSON.stringify(result.seo_scan, null, 2)}
            </pre>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">預覽建議行動</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/75">
              {(result.preview_actions ?? []).map((a, i) => (
                <li key={i}>
                  <span className="font-medium text-white">{a.title ?? "行動"}</span>
                  {a.rationale ? <span className="text-white/60"> — {a.rationale}</span> : null}
                </li>
              ))}
            </ul>
          </div>

          {result.paid ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-semibold tracking-tight text-white">完整行動清單</h2>
                <pre className="font-mono mt-4 max-h-[520px] overflow-auto rounded-xl bg-black/50 p-4 text-xs leading-relaxed text-white/80">
                  {JSON.stringify(result.full_actions, null, 2)}
                </pre>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-semibold tracking-tight text-white">轉化筆記</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                  {String(result.conversion_notes ?? "")}
                </p>
              </div>
            </>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-transparent p-6">
              <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" />
              <div className="relative">
                <h2 className="text-lg font-semibold tracking-tight text-white">完整清單同轉化筆記</h2>
                <p className="mt-2 text-sm text-white/65">
                  訂閱後可睇優先清單、工作量／影響標籤同轉化建議。
                </p>
                <button
                  type="button"
                  onClick={() => void startCheckout()}
                  disabled={checkoutLoading}
                  className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-40"
                >
                  {checkoutLoading ? "轉跳緊…" : "以 US$24/月解鎖"}
                </button>
              </div>
            </div>
          )}

          {result.usage ? (
            <details className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/50">
              <summary className="cursor-pointer font-mono text-white/70">用量／除錯</summary>
              <pre className="font-mono mt-3 overflow-auto text-[11px]">
                {JSON.stringify(
                  {
                    tokens: {
                      prompt: result.usage.promptTokens,
                      completion: result.usage.completionTokens,
                      total: result.usage.totalTokens,
                    },
                    cfRay: result.usage.cfRay,
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
