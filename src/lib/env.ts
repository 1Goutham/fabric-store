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
    return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
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
