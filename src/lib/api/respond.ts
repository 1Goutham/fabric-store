import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import type { ApiFail, ApiOk } from "@/types";

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, message: string, code = "error", fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const errors = {
  badRequest: (m = "That request could not be understood.", fields?: Record<string, string>) => new ApiError(400, m, "bad_request", fields),
  unauthorized: (m = "Please sign in to continue.") => new ApiError(401, m, "unauthorized"),
  forbidden: (m = "You do not have access to this.") => new ApiError(403, m, "forbidden"),
  notFound: (m = "We couldn't find that.") => new ApiError(404, m, "not_found"),
  conflict: (m = "That already exists.") => new ApiError(409, m, "conflict"),
  tooMany: (m = "Too many requests. Give it a moment.") => new ApiError(429, m, "rate_limited"),
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}

export function fail(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json<ApiFail>({ ok: false, error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

/** Parse and validate a JSON body against a schema, mapping issues to field messages. */
export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw errors.badRequest("Invalid JSON body.");
  }
  return parseWith(schema, raw);
}

export function parseWith<S extends ZodTypeAny>(schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    throw errors.badRequest("Please check the highlighted fields.", fields);
  }
  return result.data;
}

/**
 * Wrap a route handler: known ApiErrors become clean JSON, everything else is
 * logged server-side and returned as a generic 500. Raw errors never reach users.
 */
type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;
export function handle<Ctx = unknown>(fn: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.code, err.message, err.fields);
      if (err instanceof ZodError) return fail(400, "bad_request", "Please check your input.");
      if (isMongoDuplicate(err)) return fail(409, "conflict", "That already exists.");
      if (isMongoValidation(err)) return fail(400, "bad_request", "Some fields are invalid.");
      console.error("[api]", req.method, new URL(req.url).pathname, err);
      return fail(500, "internal", "Something went wrong on our side. Please try again.");
    }
  };
}

function isMongoDuplicate(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}
function isMongoValidation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { name?: string }).name === "ValidationError";
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
