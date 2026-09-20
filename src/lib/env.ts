/**
 * Typed access to environment configuration.
 * Server-only values are read lazily so a missing optional key never breaks the build.
 */
const required = (key: string, fallback?: string): string => {
  const v = process.env[key] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return v;
};

/**
 * Public origin of the deployment. Prefers NEXT_PUBLIC_APP_URL, then Vercel's
 * generated hostname, then localhost. Empty strings (a blank env var on
 * Vercel) are treated as unset so `new URL()` never receives "".
 */
export function resolveAppUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_APP_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    // Accept "example.com" as well as "https://example.com"; reject anything that still isn't a URL.
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      continue;
    }
  }
  return "http://localhost:3000";
}

export const env = {
  get mongodbUri() {
    return required("MONGODB_URI");
  },
  get authSecret() {
    const s = process.env.AUTH_SECRET;
    if (!s || s.length < 16) {
      if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (≥32 chars) in production");
      return "dev-only-insecure-secret-change-me";
    }
    return s;
  },
  get sessionDays() {
    return Number(process.env.AUTH_SESSION_DAYS ?? 7);
  },
  get appUrl() {
    return resolveAppUrl();
  },
  get stripeSecretKey() {
    return process.env.STRIPE_SECRET_KEY || null;
  },
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || null;
  },
  get currency() {
    return (process.env.PAYMENT_CURRENCY ?? "inr").toLowerCase();
  },
  get geminiKey() {
    return process.env.GEMINI_API_KEY || null;
  },
  get geminiModel() {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};
