/**
 * Meta / TikTok / LINE 等 App 內建瀏覽器會用特殊 User-Agent。
 * Google OAuth 喺呢啲環境經常失敗（「請使用安全瀏覽器」）——屬 Google 政策，唔係 Clerk bug。
 */
export function isLikelyInAppBrowser(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 8) return false;
  const ua = userAgent;

  if (/Instagram/i.test(ua)) return true;
  if (/FBAN|FBAV|FB_IAB|FB4A|FB_IOS|FBIOS|FBMessenger/i.test(ua)) return true;
  if (/Line\//i.test(ua)) return true;
  if (/TikTok/i.test(ua)) return true;
  if (/Snapchat/i.test(ua)) return true;
  if (/\bThreads\//i.test(ua)) return true;
  if (/LinkedInApp/i.test(ua)) return true;

  return false;
}
