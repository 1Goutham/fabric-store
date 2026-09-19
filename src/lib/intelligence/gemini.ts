import { env } from "@/lib/env";

/**
 * Minimal Gemini REST client (server-only). One call per request, short
 * timeouts, structured JSON output, and a small in-memory cache so repeated
 * queries cost nothing. No SDK, no catalogue dumps into prompts.
 */
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const TIMEOUT_MS = 7000;

export class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const geminiEnabled = () => Boolean(env.geminiKey);

type Part = { text: string };
interface GenerateResponse {
  candidates?: { content?: { parts?: Part[] } }[];
}

const cache = new Map<string, { at: number; value: string }>();
const CACHE_TTL = 10 * 60 * 1000;
const CACHE_MAX = 300;

function cacheGet(k: string) {
  const hit = cache.get(k);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL) {
    cache.delete(k);
    return null;
  }
  return hit.value;
}
function cacheSet(k: string, v: string) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(k, { at: Date.now(), value: v });
}

export interface GenerateOptions {
  system: string;
  user: string;
  json?: boolean;
  schema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
  cacheKey?: string;
}

export async function generateText(opts: GenerateOptions): Promise<string> {
  const key = env.geminiKey;
  if (!key) throw new GeminiError(0, "GEMINI_API_KEY not configured");
  const ck = opts.cacheKey ?? `${opts.system.length}:${opts.user}`;
  const cached = cacheGet(ck);
  if (cached) return cached;

  const body = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxOutputTokens ?? 512,
      ...(opts.json ? { responseMimeType: "application/json", ...(opts.schema ? { responseSchema: opts.schema } : {}) } : {}),
    },
  };
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/models/${env.geminiModel}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new GeminiError(504, err instanceof Error ? err.message : "Gemini request failed");
  }
  if (!res.ok) throw new GeminiError(res.status, `Gemini ${res.status}`);
  const data = (await res.json()) as GenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
  if (!text) throw new GeminiError(502, "Empty Gemini response");
  cacheSet(ck, text);
  return text;
}
