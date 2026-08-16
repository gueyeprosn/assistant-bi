import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayPhone } from "@/lib/phone";
import { replyHandoff, resolveConversation, resumeBot, takeHandoff } from "@/app/actions/business";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

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
        {conversations.length === 0 && <p className="text-muted">{t(lang, "noConv")}</p>}
        {conversations.map((c) => {
          const thread = [...c.messages].reverse();
          const waiting = c.status === "handoff";
          return (
            <article key={c.id} className="card p-4 space-y-3">
              <div className="flex justify-between gap-2 items-start">
                <div>
                  <div className="font-bold text-lg">
                    {c.customer.name || displayPhone(c.customer.phone)}
                  </div>
                  <div className="text-muted">{displayPhone(c.customer.phone)}</div>
                </div>
                <span
                  className={`text-sm font-bold rounded-lg px-3 py-1 ${
                    waiting ? "bg-gold text-navy" : "bg-soft text-navy"
                  }`}
                >
                  {waiting ? t(lang, "waitYou") : t(lang, "botMode")}
                </span>
              </div>
              {c.summary && <p className="bg-soft rounded-xl px-3 py-2">{c.summary}</p>}
              <div className="space-y-2">
                {thread.map((m) => (
                  <div key={m.id} className="whitespace-pre-wrap">
                    <span className="text-sm font-bold text-muted mr-2">
                      {m.direction === "inbound" ? t(lang, "client") : t(lang, "you")}
                    </span>
                    {m.text}
                    {m.direction === "outbound" && m.deliveryStatus === "failed" && (
                      <span className="block text-sm font-bold text-navy mt-1">{t(lang, "undelivered")}</span>
                    )}
                  </div>
                ))}
              </div>
              {!waiting && (
                <form action={takeHandoff}>
                  <input type="hidden" name="conversationId" value={c.id} />
                  <button className="btn btn-gold w-full text-base leading-tight py-3">
                    {t(lang, "takeHuman")}
                  </button>
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
                  <button className="btn btn-primary w-full">{t(lang, "send")}</button>
                </form>
              )}
              {waiting && (
                <form action={resumeBot}>
                  <input type="hidden" name="conversationId" value={c.id} />
                  <button className="btn btn-ghost w-full">{t(lang, "resumeBot")}</button>
                </form>
              )}
              {waiting && (
                <form action={resolveConversation}>
                  <input type="hidden" name="conversationId" value={c.id} />
                  <button className="btn btn-ghost w-full">{t(lang, "closeConv")}</button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
