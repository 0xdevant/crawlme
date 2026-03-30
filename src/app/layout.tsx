import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Noto_Sans_TC } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansTc = Noto_Sans_TC({
  variable: "--font-noto-tc",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CrawlMe — 轉化與營銷分析",
  description:
    "分析你嘅產品／營銷頁面，優先整理提升轉化、銷售線索同說服力嘅可行建議。",
  openGraph: {
    url: SITE_URL,
    siteName: "CrawlMe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body
        className={`${dmSans.variable} ${notoSansTc.variable} ${jetbrains.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
