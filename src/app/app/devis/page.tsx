import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { canUseQuotes } from "@/lib/plans";
import { getLang } from "@/lib/lang";
import { t, type I18nKey } from "@/lib/i18n";
import { parseStoredQuoteLines } from "@/lib/quotes";
import { PageHeader } from "@/components/ui/PageHeader";
import { CopyQuote } from "@/components/ui/CopyQuote";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuoteComposer } from "@/components/QuoteComposer";

const QUOTE_ERRORS: Record<string, I18nKey> = {
  need_line: "quoteNeedLine",
  bad_phone: "quoteBadPhone",
  bad_service: "quoteBadService",
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const { error } = await searchParams;
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
  const errorKey = error ? QUOTE_ERRORS[error] : undefined;

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
          {errorKey ? <p className="alert-error">{t(lang, errorKey)}</p> : null}
          <QuoteComposer
            lang={lang}
            services={services.map((s) => ({ id: s.id, name: s.name, priceFcfa: s.priceFcfa }))}
          />
          {quotes.length === 0 ? (
            <EmptyState title={t(lang, "emptyQuotesTitle")} description={t(lang, "noQuotes")} />
          ) : (
            <ul className="space-y-3">
              {quotes.map((q) => {
                const items = parseStoredQuoteLines(q.linesJson);
                return (
                  <li key={q.id} className="card p-4 space-y-3">
                    <div className="flex justify-between gap-2 font-bold">
                      <span>{q.customer.name || q.customer.phone}</span>
                      <span>{formatFcfa(q.totalFcfa)}</span>
                    </div>
                    {items.length > 1 ? (
                      <p className="text-muted">
                        {items.length} {t(lang, "quoteItems")}
                      </p>
                    ) : null}
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
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
