import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEnv, requireEnv } from "@/lib/env";
import { checkAndConsumeFreeScanQuota } from "@/lib/quota";
import { extractSeoFacts } from "@/lib/seo-extract";
import { fetchPageHtml } from "@/lib/seo-fetch";
import { getClientIp } from "@/lib/request-ip";
import { buildFreeScanPrompt, buildPaidScanPrompt } from "@/lib/scan-prompts";
import {
  getSubscriptionForCustomer,
  isActiveSubscription,
} from "@/lib/subscription";
import { normalizeAndAssertSafeUrl } from "@/lib/ssrf";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { veniceChatJson } from "@/lib/venice";

const bodySchema = z.object({
  url: z.string().min(4).max(2048),
  turnstileToken: z.string().min(1).optional(),
});

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const slice = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  const parsed = JSON.parse(slice) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Model output was not a JSON object");
  }
  return parsed as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const turnstileSecret = getEnv("TURNSTILE_SECRET_KEY");
    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "請求內容無效" }, { status: 400 });
    }

    const ip = getClientIp(request);
    if (turnstileSecret) {
      const token = parsed.data.turnstileToken;
      if (!token) {
        return NextResponse.json({ error: "請先完成人機驗證" }, { status: 400 });
      }
      const ok = await verifyTurnstileToken({
        secret: turnstileSecret,
        token,
        remoteip: ip,
      });
      if (!ok) {
        return NextResponse.json({ error: "人機驗證失敗，請重試" }, { status: 400 });
      }
    }

    const cookieStore = await cookies();
    const customerId = cookieStore.get("crawlme_customer")?.value;
    const sub = await getSubscriptionForCustomer(customerId);
    const paid = isActiveSubscription(sub);

    const dailyLimit = Number.parseInt(getEnv("FREE_DAILY_SCANS") ?? "3", 10);
    const safeLimit = Number.isFinite(dailyLimit) && dailyLimit > 0 ? dailyLimit : 3;

    if (!paid) {
      const q = await checkAndConsumeFreeScanQuota({
        clientKey: ip,
        dailyLimit: safeLimit,
      });
      if (!q.allowed) {
        return NextResponse.json(
          {
            error: "已達每日免費掃描上限",
            remaining: 0,
            upgrade: true,
          },
          { status: 429 },
        );
      }
    }

    const safe = await normalizeAndAssertSafeUrl(parsed.data.url);
    const page = await fetchPageHtml(safe.href);
    const facts = extractSeoFacts({
      url: safe.href,
      finalUrl: page.finalUrl,
      status: page.status,
      html: page.html,
      headerPairs: page.headerPairs,
    });

    const apiKey = requireEnv("VENICE_API_KEY");
    const model = getEnv("VENICE_MODEL") ?? "venice-uncensored";

    const messages = paid ? buildPaidScanPrompt(facts) : buildFreeScanPrompt(facts);

    const { text, usage } = await veniceChatJson({
      apiKey,
      model,
      messages,
      veniceParameters: { include_venice_system_prompt: false },
    });

    const obj = parseJsonObject(text);

    if (!paid) {
      const stripped = {
        seo_scan: obj.seo_scan ?? null,
        preview_actions: obj.preview_actions ?? [],
        full_actions: null,
        conversion_notes: null,
        paid: false,
        usage,
        facts,
      };
      return NextResponse.json(stripped);
    }

    return NextResponse.json({
      seo_scan: obj.seo_scan ?? null,
      preview_actions: obj.preview_actions ?? [],
      full_actions: obj.full_actions ?? [],
      conversion_notes: obj.conversion_notes ?? null,
      paid: true,
      usage,
      facts,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "發生錯誤";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
