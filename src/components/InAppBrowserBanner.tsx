"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useState, useSyncExternalStore } from "react";
import { isLikelyInAppBrowser } from "@/lib/in-app-browser";

const noopSubscribe = () => () => {};

function readInAppFromUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return isLikelyInAppBrowser(navigator.userAgent);
}

/**
 * Warn when opened inside Instagram / Threads / Facebook in-app browser:
 * Google Sign-In often shows "use a secure browser" — user should open in Safari/Chrome or use email.
 */
export function InAppBrowserBanner() {
  const { isLoaded, isSignedIn } = useAuth();
  const inApp = useSyncExternalStore(noopSubscribe, readInAppFromUa, () => false);
  const [copied, setCopied] = useState(false);

  const copyUrl = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  if (!isLoaded || isSignedIn || !inApp) return null;

  return (
    <div
      className="border-b border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm leading-snug text-on-surface sm:px-6"
      role="status"
      aria-live="polite"
    >
      <p className="mx-auto max-w-7xl">
        <span className="font-semibold text-amber-950/90">
          你而家用緊 App 內建瀏覽器
        </span>
        ——Google 登入可能會話「請使用安全瀏覽器」。請喺右上角選「用 Safari／Chrome
        開啟」本頁，或者改用<strong className="font-semibold">電郵登入</strong>
        （Clerk 彈窗入面）。{" "}
        <button
          type="button"
          onClick={copyUrl}
          className="insights-focus-ring font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary-container"
        >
          {copied ? "已複製連結" : "複製本頁連結"}
        </button>
      </p>
    </div>
  );
}
