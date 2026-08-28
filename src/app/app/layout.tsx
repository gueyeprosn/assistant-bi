import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireOwner } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { getLang } from "@/lib/lang";
import { getSubscriptionStatus } from "@/lib/plans";
import { getAssistantConnectionStatus } from "@/lib/whatsapp/status";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireOwner();
  if (!ctx) redirect("/login");
  const lang = await getLang();
  const access = getSubscriptionStatus(ctx.business);
  const path = (await headers()).get("x-pathname") || "";
  if (access.blocked && !path.startsWith("/app/abonnement")) {
    redirect("/app/abonnement");
  }
  const waStatus = getAssistantConnectionStatus(ctx.business);
  return (
    <AppShell
      businessName={ctx.business.name}
      impersonating={ctx.session.impersonating}
      lang={lang}
      waStatus={waStatus}
    >
      {children}
    </AppShell>
  );
}
