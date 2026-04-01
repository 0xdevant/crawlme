import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getFreeGlobalDailyLimit,
  getGlobalFreeScanRemaining,
  isDeviceFreeScanUsed,
  isIpFreeScanUsed,
  isQuotaBypassIp,
  isUserFreeScanUsed,
} from "@/lib/quota";
import { getClientIp } from "@/lib/request-ip";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  const ip = getClientIp(request);
  const bypass = isQuotaBypassIp(ip);
  const globalLimit = getFreeGlobalDailyLimit();

  const deviceParam = request.nextUrl.searchParams.get("deviceId")?.trim();
  const validDevice =
    deviceParam && z.string().uuid().safeParse(deviceParam).success
      ? deviceParam
      : null;

  if (bypass) {
    const freeGlobalRemaining = await getGlobalFreeScanRemaining(globalLimit);
    return NextResponse.json({
      quotaBypass: true,
      freeGlobalRemaining,
      freeGlobalLimit: globalLimit,
    });
  }

  let userAlreadyUsedFree = false;
  if (userId) {
    userAlreadyUsedFree = await isUserFreeScanUsed(userId);
  }
  let deviceAlreadyUsedFree = false;
  if (validDevice) {
    deviceAlreadyUsedFree = await isDeviceFreeScanUsed(validDevice);
  }
  const ipAlreadyUsedFree = await isIpFreeScanUsed(ip);
  const freeGlobalRemaining = await getGlobalFreeScanRemaining(globalLimit);

  return NextResponse.json({
    quotaBypass: false,
    ipAlreadyUsedFree,
    userAlreadyUsedFree,
    deviceAlreadyUsedFree,
    freeGlobalRemaining,
    freeGlobalLimit: globalLimit,
  });
}
