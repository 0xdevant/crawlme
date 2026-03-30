import { SITE_URL } from "@/lib/site";

const MAX_BYTES = 2_000_000;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 12_000;

export type FetchPageResult = {
  finalUrl: string;
  status: number;
  html: string;
  headerPairs: [string, string][];
};

function mergeChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function fetchPageHtml(targetUrl: string): Promise<FetchPageResult> {
  let current = targetUrl;
  let lastStatus = 0;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": `CrawlMeBot/1.0 (+${SITE_URL})`,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    }).finally(() => clearTimeout(t));

    lastStatus = res.status;

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect without Location header");
      current = new URL(loc, current).toString();
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching page`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("Empty response body");

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_BYTES) {
          reader.cancel().catch(() => {});
          throw new Error("Page exceeds maximum download size");
        }
        chunks.push(value);
      }
    }

    const merged = mergeChunks(chunks);
    const html = new TextDecoder("utf-8").decode(merged);

    const headerPairs: [string, string][] = [];
    res.headers.forEach((v, k) => headerPairs.push([k, v]));

    return {
      finalUrl: current,
      status: lastStatus,
      html,
      headerPairs,
    };
  }

  throw new Error("Too many redirects");
}
