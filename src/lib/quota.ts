import { getCloudflareContext } from "@opennextjs/cloudflare";

const memory = new Map<string, number>();

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getKv(): Promise<KVNamespace | null> {
  try {
    const { env } = getCloudflareContext();
    const kv = (env as { CRAWLME_KV?: KVNamespace }).CRAWLME_KV;
    return kv ?? null;
  } catch {
    return null;
  }
}

export async function checkAndConsumeFreeScanQuota(params: {
  clientKey: string;
  dailyLimit: number;
}): Promise<{ allowed: true; remaining: number } | { allowed: false; remaining: number }> {
  const day = utcDay();
  const key = `quota:free:${params.clientKey}:${day}`;
  const kv = await getKv();

  if (kv) {
    const raw = await kv.get(key);
    const used = raw ? Number.parseInt(raw, 10) : 0;
    const safeUsed = Number.isFinite(used) ? used : 0;
    if (safeUsed >= params.dailyLimit) {
      return { allowed: false, remaining: 0 };
    }
    await kv.put(key, String(safeUsed + 1), { expirationTtl: 60 * 60 * 48 });
    return { allowed: true, remaining: Math.max(0, params.dailyLimit - safeUsed - 1) };
  }

  const prev = memory.get(key) ?? 0;
  if (prev >= params.dailyLimit) {
    return { allowed: false, remaining: 0 };
  }
  memory.set(key, prev + 1);
  return { allowed: true, remaining: Math.max(0, params.dailyLimit - prev - 1) };
}
