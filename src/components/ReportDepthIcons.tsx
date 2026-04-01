/**
 * Depth-card icons: Material Symbols Rounded (Apache-2.0), same glyphs Stitch uses via the
 * Material Symbols font — inlined from `rounded/bolt.svg`, `rounded/bar_chart.svg`,
 * `rounded/code.svg`, `rounded/priority.svg`, `rounded/lightbulb.svg` in
 * `@material-symbols/svg-400` (no extra network request).
 * List checkmarks remain Heroicons v2 (MIT).
 */
export function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -960 960 960" fill="currentColor" aria-hidden>
      <path d="m393-165 279-335H492l36-286-253 366h154l-36 255Zm-33-195H217q-18 0-26.5-16t2.5-31l338-488q8-11 20-15t24 1q12 5 19 16t5 24l-39 309h176q19 0 27 17t-4 32L388-66q-8 10-20.5 13T344-55q-11-5-17.5-16T322-95l38-265Zm113-115Z" />
    </svg>
  );
}

export function IconChartBar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -960 960 960" fill="currentColor" aria-hidden>
      <path d="M690-160q-12.75 0-21.37-8.63Q660-177.25 660-190v-220q0-12.75 8.63-21.38Q677.25-440 690-440h80q12.75 0 21.38 8.62Q800-422.75 800-410v220q0 12.75-8.62 21.37Q782.75-160 770-160h-80Zm-250 0q-12.75 0-21.37-8.63Q410-177.25 410-190v-580q0-12.75 8.63-21.38Q427.25-800 440-800h80q12.75 0 21.38 8.62Q550-782.75 550-770v580q0 12.75-8.62 21.37Q532.75-160 520-160h-80Zm-250 0q-12.75 0-21.37-8.63Q160-177.25 160-190v-380q0-12.75 8.63-21.38Q177.25-600 190-600h80q12.75 0 21.38 8.62Q300-582.75 300-570v380q0 12.75-8.62 21.37Q282.75-160 270-160h-80Z" />
    </svg>
  );
}

/** 技術審核 — `</>` code brackets (Material `code`). */
export function IconCode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -960 960 960" fill="currentColor" aria-hidden>
      <path d="m166-482 176 176q9 9 8.5 21t-9.5 21q-9 9-21.5 9t-21.5-9L101-461q-5-5-7-10t-2-11q0-6 2-11t7-10l200-200q9-9 21.5-9t21.5 9q9 9 9 21.5t-9 21.5L166-482Zm628 0L618-658q-9-9-8.5-21t9.5-21q9-9 21.5-9t21.5 9l197 197q5 5 7 10t2 11q0 6-2 11t-7 10L659-261q-9 9-21 8.5t-21-9.5q-9-9-9-21.5t9-21.5l177-177Z" />
    </svg>
  );
}

/** 「可執行嘅優先建議」— header glyph (priority / checklist in rounded square). */
export function IconPriority({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -960 960 960" fill="currentColor" aria-hidden>
      <path d="M351-120q-97 0-164-67t-67-164v-258q0-97 67-164t164-67h258q97 0 164 67t67 164v258q0 97-67 164t-164 67H351Zm88-291-76-76q-9-9-21.5-8.5T320-486q-9 9-9 21.5t9 21.5l98 97q9 9 21 9t21-9l198-198q9-9 9-21.5t-9-21.5q-9-9-21.5-9t-21.5 9L439-411Zm-88 231h258q71 0 121-50t50-121v-258q0-71-50-121t-121-50H351q-71 0-121 50t-50 121v258q0 71 50 121t121 50Zm129-300Z" />
    </svg>
  );
}

export function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function IconLightbulbWatermark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 -960 960 960" fill="currentColor" aria-hidden>
      <path d="M422.5-103.5Q399-127 399-161h162q0 34-23.5 57.5T480-80q-34 0-57.5-23.5ZM348-223q-13 0-21.5-8.5T318-253q0-13 8.5-21.5T348-283h264q13 0 21.5 8.5T642-253q0 13-8.5 21.5T612-223H348Zm-25-121q-66-43-104.5-107.5T180-597q0-122 89-211t211-89q122 0 211 89t89 211q0 81-38 145.5T637-344H323Zm22-60h271q48-32 76-83t28-110q0-99-70.5-169.5T480-837q-99 0-169.5 70.5T240-597q0 59 28 110t77 83Zm135 0Z" />
    </svg>
  );
}
