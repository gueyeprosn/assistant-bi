import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import type { ErrorCode } from "@/lib/errors";

export function limitedJson(key: string, max: number, windowMs: number) {
  const hit = rateLimit(key, max, windowMs);
  if (hit.ok) return null;
  const err = jsonError("RATE_LIMITED");
  return NextResponse.json(err.body, { status: err.status });
}

export function errorJson(code: ErrorCode, lang: "fr" | "wo" = "fr") {
  const err = jsonError(code, lang);
  return NextResponse.json(err.body, { status: err.status });
}
