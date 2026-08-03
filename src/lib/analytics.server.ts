/**
 * Server-only analytics helpers: bot filtering, device/browser/OS parsing and
 * geo lookup from edge headers. Vendor-agnostic — we read the headers set by
 * Cloudflare, Vercel, Fastly and generic proxies, so the same code works on any
 * host and any custom domain.
 */

const BOT_PATTERNS = [
  "bot", "crawl", "spider", "slurp", "curl", "wget", "python-requests", "headlesschrome",
  "phantomjs", "puppeteer", "playwright", "lighthouse", "pingdom", "uptime", "monitor",
  "facebookexternalhit", "embedly", "quora link preview", "whatsapp", "telegrambot",
  "discordbot", "slackbot", "twitterbot", "linkedinbot", "applebot", "ahrefs", "semrush",
  "mj12bot", "dotbot", "petalbot", "bingpreview", "yandex", "gptbot", "claudebot",
  "ccbot", "perplexitybot", "google-inspectiontool", "chrome-lighthouse", "vercel",
];

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true; // no UA at all == not a real browser session
  const s = ua.toLowerCase();
  return BOT_PATTERNS.some((p) => s.includes(p));
}

export function parseDevice(ua: string | null | undefined): {
  deviceType: string;
  browser: string;
  os: string;
} {
  const s = (ua ?? "").toLowerCase();

  const tablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s);
  const mobile = /iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|mobile safari/.test(s);
  const deviceType = tablet ? "tablet" : mobile ? "mobile" : s ? "desktop" : "unknown";

  let browser = "Other";
  if (/edg\//.test(s)) browser = "Edge";
  else if (/opr\/|opera/.test(s)) browser = "Opera";
  else if (/samsungbrowser/.test(s)) browser = "Samsung Internet";
  else if (/firefox|fxios/.test(s)) browser = "Firefox";
  else if (/chrome|crios/.test(s)) browser = "Chrome";
  else if (/safari/.test(s)) browser = "Safari";

  let os = "Other";
  if (/windows/.test(s)) os = "Windows";
  else if (/iphone|ipad|ipod|ios/.test(s)) os = "iOS";
  else if (/mac os x|macintosh/.test(s)) os = "macOS";
  else if (/android/.test(s)) os = "Android";
  else if (/cros/.test(s)) os = "ChromeOS";
  else if (/linux/.test(s)) os = "Linux";

  return { deviceType, browser, os };
}

/** Reads geo hints from whichever edge/CDN is in front of the app. */
export function geoFromHeaders(get: (name: string) => string | null | undefined): {
  country: string | null;
  city: string | null;
} {
  const country =
    get("cf-ipcountry") ||
    get("x-vercel-ip-country") ||
    get("x-geo-country") ||
    get("x-country-code") ||
    get("fastly-client-country") ||
    get("x-appengine-country") ||
    null;

  const rawCity =
    get("cf-ipcity") ||
    get("x-vercel-ip-city") ||
    get("x-geo-city") ||
    get("x-appengine-city") ||
    null;

  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }

  const norm = (v: string | null) => {
    if (!v) return null;
    const t = v.trim();
    return !t || t === "XX" || t.toLowerCase() === "unknown" ? null : t;
  };

  return { country: norm(country), city: norm(city) };
}

/** Traffic we never want in the numbers: previews, localhost, internal tooling. */
export function isExcludedTraffic(opts: {
  path: string;
  host: string | null;
  userAgent: string | null;
}): boolean {
  const path = opts.path.toLowerCase();
  if (
    path.startsWith("/admin") ||
    path.startsWith("/auth") ||
    path.startsWith("/api") ||
    path.startsWith("/.mcp") ||
    path.startsWith("/mcp") ||
    path.startsWith("/.well-known")
  ) {
    return true;
  }

  const host = (opts.host ?? "").toLowerCase();
  if (
    host.includes("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.includes("-preview--") ||
    host.includes("lovableproject.com") ||
    host.endsWith(".local")
  ) {
    return true;
  }

  return isBotUserAgent(opts.userAgent);
}
