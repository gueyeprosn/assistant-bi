import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { canUseQuotes } from "@/lib/plans";
import { createManualQuote } from "@/app/actions/business";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { CopyQuote } from "@/components/ui/CopyQuote";

export default async function QuotesPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const allowed = canUseQuotes(ctx.business.plan, ctx.business.status);
  const [quotes, services] = await Promise.all([
    allowed
      ? prisma.quote.findMany({
          where: { businessId: ctx.business.id },
          include: { customer: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    prisma.service.findMany({
      where: { businessId: ctx.business.id, active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title={t(lang, "quotes")} help={t(lang, "quoteHelp")} />
      {!allowed ? (
        <div className="card p-5">
          <p className="text-muted">{t(lang, "quotesLocked")}</p>
          <Link href="/app/abonnement" className="btn btn-primary mt-4 inline-flex w-full">
            {t(lang, "seePlans")}
          </Link>
        </div>
      ) : (
        <>
          <form action={createManualQuote} className="card p-4 space-y-3">
            <p className="font-bold text-lg">{t(lang, "createQuote")}</p>
            <label className="block font-bold">
              {t(lang, "pickService")}
              <select name="serviceId" required className="field mt-1">
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatFcfa(s.priceFcfa)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-bold">
              {t(lang, "quotePhone")}
              <input name="phone" required inputMode="tel" placeholder="77 …" className="field mt-1" />
            </label>
            <label className="block font-bold">
              {t(lang, "quoteNote")}
              <textarea name="note" rows={2} className="field mt-1 min-h-20" />
            </label>
            <button className="btn btn-primary w-full">{t(lang, "makeQuote")}</button>
          </form>
          {quotes.length === 0 ? (
            <p className="text-muted">{t(lang, "noQuotes")}</p>
          ) : (
            <ul className="space-y-3">
              {quotes.map((q) => (
                <li key={q.id} className="card p-4 space-y-3">
                  <div className="flex justify-between gap-2 font-bold">
                    <span>{q.customer.name || q.customer.phone}</span>
                    <span>{formatFcfa(q.totalFcfa)}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-navy bg-soft rounded-xl px-3 py-3">
                    {q.textBody}
                  </pre>
                  <CopyQuote
                    text={q.textBody}
                    phone={q.customer.phone}
                    copyLabel={t(lang, "copyQuote")}
                    copiedLabel={t(lang, "copied")}
                    sendLabel={t(lang, "sendWa")}
                  />
                  <div className="text-sm text-muted">{formatDateTime(q.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
