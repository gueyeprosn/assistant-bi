import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayPhone } from "@/lib/phone";
import { replyHandoff, resolveConversation, resumeBot } from "@/app/actions/business";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export default async function MessagesPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const conversations = await prisma.conversation.findMany({
    where: { businessId: ctx.business.id, status: { not: "archived" } },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 8 },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-navy">{t(lang, "messages")}</h1>
        <p className="text-muted mt-2">{t(lang, "messagesHelp")}</p>
      </div>
      <div className="space-y-4">
        {conversations.length === 0 && <p className="text-muted">{t(lang, "noConv")}</p>}
        {conversations.map((c) => {
          const thread = [...c.messages].reverse();
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
                    c.status === "handoff" ? "bg-gold text-navy" : "bg-soft text-navy"
                  }`}
                >
                  {c.status === "handoff" ? t(lang, "waitYou") : t(lang, "botMode")}
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
              {c.status === "handoff" && (
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
              <form action={resumeBot}>
                <input type="hidden" name="conversationId" value={c.id} />
                <button className="btn btn-ghost w-full">{t(lang, "resumeBot")}</button>
              </form>
              {c.status === "handoff" && (
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
