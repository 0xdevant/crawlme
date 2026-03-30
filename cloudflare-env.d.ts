interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

declare namespace Cloudflare {
  interface Env {
    CRAWLME_KV: KVNamespace;
  }
}

type CloudflareEnv = Cloudflare.Env;
