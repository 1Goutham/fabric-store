import type { ApiResponse } from "@/types";

export class ApiClientError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function request<T>(method: string, url: string, body?: unknown, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      ...init,
    });
  } catch {
    throw new ApiClientError(0, "network", "You appear to be offline. Check your connection and try again.");
  }
  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    /* non-JSON */
  }
  if (!res.ok || !json || !json.ok) {
    const err = json && !json.ok ? json.error : { code: "http", message: "Something went wrong. Please try again." };
    throw new ApiClientError(res.status, err.code, err.message, err.fields);
  }
  return json.data;
}

export const api = {
  get: <T>(url: string, init?: RequestInit) => request<T>("GET", url, undefined, init),
  post: <T>(url: string, body?: unknown, init?: RequestInit) => request<T>("POST", url, body, init),
  patch: <T>(url: string, body?: unknown, init?: RequestInit) => request<T>("PATCH", url, body, init),
  put: <T>(url: string, body?: unknown, init?: RequestInit) => request<T>("PUT", url, body, init),
  delete: <T>(url: string, init?: RequestInit) => request<T>("DELETE", url, undefined, init),
};

export const messageOf = (err: unknown, fallback = "Something went wrong.") => (err instanceof Error && err.message ? err.message : fallback);
