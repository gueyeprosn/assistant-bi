import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayPhone } from "@/lib/phone";
import { formatTime } from "@/lib/format";
import { replyHandoff, resolveConversation, resumeBot, takeHandoff } from "@/app/actions/business";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Badge } from "@/components/ui/Badge";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const { f } = await searchParams;
  const handoffOnly = f === "handoff";
  const conversations = await prisma.conversation.findMany({
    where: {
      businessId: ctx.business.id,
      status: handoffOnly ? "handoff" : { not: "archived" },
    },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 8 },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-5">
      <PageHeader title={t(lang, "messages")} help={t(lang, "messagesHelp")} />
      <div className="flex gap-2">
        <Link
          href="/app/messages"
          className={`btn min-h-12 flex-1 ${handoffOnly ? "btn-ghost" : "btn-primary"}`}
        >
          {t(lang, "filterAll")}
        </Link>
        <Link
          href="/app/messages?f=handoff"
          className={`btn min-h-12 flex-1 ${handoffOnly ? "btn-primary" : "btn-ghost"}`}
        >
          {t(lang, "waitYou")}
        </Link>
      </div>
      <div className="space-y-4">
        {conversations.length === 0 && (
          <EmptyState title={t(lang, "emptyConvTitle")} description={t(lang, "noConv")} />
        )}
        {conversations.map((c) => {
          const thread = [...c.messages].reverse();
          const waiting = c.status === "handoff";
          const langLabel = c.language === "wo" ? t(lang, "wolof") : c.language === "fr" ? t(lang, "french") : null;
          return (
            <article key={c.id} className="card p-4 space-y-3">
              <div className="flex justify-between gap-2 items-start">
                <div>
                  <div className="font-bold text-lg">
                    {c.customer.name || displayPhone(c.customer.phone)}
                  </div>
                  <div className="text-muted flex items-center gap-2 flex-wrap">
                    <span>{displayPhone(c.customer.phone)}</span>
                    {langLabel ? <Badge tone="neutral">{langLabel}</Badge> : null}
                  </div>
                </div>
                <Badge tone={waiting ? "warning" : "info"}>{waiting ? t(lang, "waitYou") : t(lang, "botMode")}</Badge>
              </div>
              {c.summary && <p className="bg-soft rounded-xl px-3 py-2">{c.summary}</p>}
              <div className="space-y-2">
                {thread.map((m) => (
                  <div key={m.id} className="whitespace-pre-wrap">
                    <span className="text-sm font-bold text-muted mr-2">
                      {m.direction === "inbound"
                        ? t(lang, "client")
                        : m.author === "owner"
                          ? t(lang, "you")
                          : t(lang, "brand")}
                    </span>
                    <span className="text-xs text-muted mr-2 tabular-nums">{formatTime(m.createdAt)}</span>
                    {m.text}
                    {m.direction === "outbound" && m.deliveryStatus === "failed" && (
                      <span className="block text-sm font-bold text-danger mt-1">{t(lang, "undelivered")}</span>
                    )}
                  </div>
                ))}
              </div>
              {!waiting && (
                <form action={takeHandoff}>
                  <input type="hidden" name="conversationId" value={c.id} />
                  <SubmitButton className="btn btn-gold w-full text-base leading-tight py-3">
                    {t(lang, "takeHuman")}
                  </SubmitButton>
                  <p className="text-muted text-sm mt-2 text-center">{t(lang, "takeHumanHelp")}</p>
                </form>
              )}
              {waiting && (
                <form action={replyHandoff} className="space-y-2">
                  <input type="hidden" name="conversationId" value={c.id} />
                  <input
                    name="text"
                    required
                    placeholder={t(lang, "reply")}
                    className="field"
                  />
                  <SubmitButton>{t(lang, "send")}</SubmitButton>
                </form>
              )}
              {waiting && (
                <form action={resumeBot}>
                  <input type="hidden" name="conversationId" value={c.id} />
                  <SubmitButton className="btn btn-ghost w-full">{t(lang, "resumeBot")}</SubmitButton>
                </form>
              )}
              {waiting && (
                <form action={resolveConversation}>
                  <input type="hidden" name="conversationId" value={c.id} />
                  <SubmitButton className="btn btn-ghost w-full">{t(lang, "closeConv")}</SubmitButton>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
