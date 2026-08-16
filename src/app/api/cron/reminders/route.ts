import { NextRequest, NextResponse } from "next/server";
import { sendJ1Reminders } from "@/lib/reminders";
import { jsonError, jsonOk } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization");
  const vercelCron = req.headers.get("x-vercel-cron");
  const q = req.nextUrl.searchParams.get("secret");
  const ok =
    vercelCron === "1" ||
    (secret && auth === `Bearer ${secret}`) ||
    (secret && q === secret);
  if (!ok) {
    const err = jsonError("CRON_UNAUTHORIZED", "Non autorisé", 401);
    return NextResponse.json(err.body, { status: err.status });
  }
  const result = await sendJ1Reminders();
  return NextResponse.json(jsonOk({ sent: result.sent, checked: result.checked }));
}
