import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSubscriptionForCustomer,
  isActiveSubscription,
} from "@/lib/subscription";

export async function GET() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("crawlme_customer")?.value;
  const sub = await getSubscriptionForCustomer(customerId);
  return NextResponse.json({ paid: isActiveSubscription(sub) });
}
