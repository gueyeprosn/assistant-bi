import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const body = await checkHealth();
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ ok: false, service: "assistant-bi" }, { status: 503 });
  }
}
