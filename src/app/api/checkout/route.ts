import { NextRequest, NextResponse } from "next/server";
import { getEnv, requireEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";
import { SITE_URL } from "@/lib/site";

export async function POST(request: NextRequest) {
  try {
    const priceId = requireEnv("STRIPE_PRICE_ID");
    const stripe = getStripe();

    const origin =
      request.headers.get("origin") ??
      getEnv("NEXT_PUBLIC_APP_URL") ??
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : SITE_URL);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "無法建立結帳連結" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "無法開始結帳";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
