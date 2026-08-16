import type { NextRequest } from "next/server";

export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization");
  const vercelCron = req.headers.get("x-vercel-cron");
  const q = req.nextUrl.searchParams.get("secret");
  return (
    vercelCron === "1" ||
    (!!secret && auth === `Bearer ${secret}`) ||
    (!!secret && q === secret)
  );
}
