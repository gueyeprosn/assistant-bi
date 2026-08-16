import { NextRequest, NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-error";
import { isCronAuthorized } from "@/lib/cron-auth";
import { runRetention } from "@/lib/retention";

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    const err = jsonError("CRON_UNAUTHORIZED");
    return NextResponse.json(err.body, { status: err.status });
  }
  const result = await runRetention();
  return NextResponse.json(jsonOk(result));
}
