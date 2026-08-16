import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS, getSubscriptionStatus, planPrice } from "@/lib/plans";
import { formatDateTime, formatFcfa, planLabel, statusLabel } from "@/lib/format";
import { merchantNumbers } from "@/lib/payments/manual";
import { requestManualPayment, requestAccountDeletion } from "@/app/actions/business";
import { getLang } from "@/app/actions/lang";
import { t } from "@/lib/i18n";

export default async function BillingPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const payments = await prisma.subscriptionPayment.findMany({
    where: { businessId: ctx.business.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const merchants = merchantNumbers();
  const amount = planPrice(ctx.business.plan === "trial" ? "standard" : ctx.business.plan);
  const access = getSubscriptionStatus(ctx.business);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-navy">{t(lang, "billing")}</h1>
      {access.blocked && (
        <div className="card px-4 py-3 bg-gold/15 font-medium">{t(lang, "subscriptionBlocked")}</div>
      )}
      <div className="card p-5">
        <p className="text-muted">{t(lang, "currentPlan")}</p>
        <p className="text-2xl font-bold text-navy mt-1">
          {planLabel(ctx.business.plan)} · {statusLabel(ctx.business.status)}
        </p>
        {ctx.business.trialEndsAt && ctx.business.status === "trial" && (
          <p className="mt-2">
            {ctx.business.trialEndsAt.toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      <div className="grid gap-3">
        {Object.values(PLANS).map((p) => (
          <form key={p.id} action={requestManualPayment} className="card p-4 space-y-3">
            <input type="hidden" name="plan" value={p.id} />
            <div className="text-xl font-bold">{p.name}</div>
            <div className="text-2xl font-bold text-navy">{formatFcfa(p.priceFcfa)} / mois</div>
            <p className="text-muted">{p.target}</p>
            <select name="channel" className="field">
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
            </select>
            <button className="btn btn-primary w-full">{t(lang, "payThis")}</button>
          </form>
        ))}
      </div>

      <div className="rounded-2xl bg-navy text-white p-5 space-y-2">
        <p className="text-lg font-bold">Wave / Orange Money</p>
        <p>
          {t(lang, "payHelp")} {formatFcfa(amount)} · Wave {merchants.wave} · OM {merchants.orange}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-bold text-navy mb-2">{t(lang, "history")}</h2>
        <ul className="card divide-y divide-line">
          {payments.length === 0 && (
            <li className="px-4 py-6 text-muted">{t(lang, "noPay")}</li>
          )}
          {payments.map((p) => (
            <li key={p.id} className="px-4 py-3 flex justify-between gap-2">
              <span className="font-semibold">
                {formatFcfa(p.amountFcfa)} · {p.channel}
              </span>
              <span className="text-muted">{formatDateTime(p.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
      <form action={requestAccountDeletion} className="card p-4 space-y-2">
        <p className="font-bold">{t(lang, "deleteAccount")}</p>
        <p className="text-muted">{t(lang, "deleteAccountHelp")}</p>
        <button className="btn btn-ghost w-full">{t(lang, "deleteAccount")}</button>
      </form>
    </div>
  );
}
