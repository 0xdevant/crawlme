import { ScanForm } from "@/components/ScanForm";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { THREADS_PROFILE_URL } from "@/lib/threads-constants";

export default function Home() {
  const mailto = `mailto:${CONTACT_EMAIL}`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.08),_transparent_50%)]" />
      <main className="relative mx-auto flex max-w-3xl flex-col gap-12 px-6 py-16 sm:py-24">
        <header className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-200/80">CrawlMe</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            幫你嘅網站更易轉化、更易賣
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-white/65">
            貼上公開頁面網址。CrawlMe 擷取頁面事實，並優先分析<strong className="text-white/80">營銷說服力、轉化阻力同下一步行動</strong>
            （其次先係技術／搜尋可見度）。免費版有概覽同 3 條預覽；Pro 解鎖完整優先清單同轉化筆記。
          </p>
        </header>

        <ScanForm />

        <footer className="border-t border-white/10 pt-10 text-sm text-white/60">
          <div className="grid gap-10 sm:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/80">聯絡我們</h2>
              <p className="text-xs leading-relaxed text-white/55">
                有合作、媒體或產品問題，歡迎聯絡。
              </p>
              <ul className="flex flex-col gap-2 text-xs">
                <li>
                  <a href={mailto} className="text-amber-200/90 underline decoration-amber-400/35 underline-offset-2 hover:text-amber-100">
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={THREADS_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-300/95 underline decoration-violet-400/35 underline-offset-2 hover:text-violet-200"
                  >
                    Threads — @pls.clawify
                  </a>
                </li>
                <li className="font-mono text-[11px] text-white/40">{SITE_URL}</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/80">免責聲明</h2>
              <p className="text-xs leading-relaxed text-white/50">
                CrawlMe 以自動化方式擷取你提供嘅公開網址內容，並整理成建議；<strong className="text-white/65">唔構成法律、財務、稅務或專業顧問意見</strong>
                ，亦<strong className="text-white/65">不保證</strong>
                搜尋排名、流量、轉化率、銷售或任何商業結果。你應自行判斷同承擔使用建議嘅風險。服務可能會變更或中斷，恕不另行通知。
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
