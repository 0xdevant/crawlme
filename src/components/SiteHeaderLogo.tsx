"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { INSIGHTS_NAVIGATE_HOME_EVENT } from "@/lib/header-events";

/**
 * Logo + title: on `/` same-route clicks don’t remount the page — we dispatch an
 * event so `ScanForm` can show the marketing hero and hide the report until the
 * user chooses「返回報告」.
 */
export function SiteHeaderLogo() {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      prefetch={false}
      className="insights-focus-ring inline-flex min-h-[44px] items-center gap-2 px-1 py-1.5 transition-opacity hover:opacity-90"
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(INSIGHTS_NAVIGATE_HOME_EVENT));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      <Image
        src="/logo-header.webp"
        alt=""
        width={400}
        height={400}
        priority
        sizes="(max-width: 640px) 40px, 44px"
        className="h-auto w-auto max-h-10 object-contain sm:max-h-11"
      />
      <span className="font-headline text-lg font-semibold tracking-tight text-on-surface sm:text-xl">
        Insights
      </span>
    </Link>
  );
}
