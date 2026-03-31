import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Read a string env var: `process.env` first, then Cloudflare Worker `env` (OpenNext
 * usually mirrors secrets into `process.env`, but fallback avoids edge cases in prod).
 * Whitespace-only is treated as unset (important: `"" ?? default` would otherwise keep "").
 */
export function getEnv(name: string): string | undefined {
  const normalize = (raw: string | undefined): string | undefined => {
    if (raw === undefined) return undefined;
    const t = raw.trim();
    return t === "" ? undefined : t;
  };

  const fromProcess = normalize(process.env[name]);
  if (fromProcess !== undefined) return fromProcess;

  try {
    const { env } = getCloudflareContext();
    const raw = (env as unknown as Record<string, unknown>)[name];
    if (typeof raw === "string") return normalize(raw);
  } catch {
    // Not in a Worker request (e.g. `next dev` without wrangler, build, tests).
  }

  return undefined;
}

export function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}
