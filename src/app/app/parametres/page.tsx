import { requireOwner } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { saveWhatsAppSettings } from "@/app/actions/business";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { CopyField } from "@/components/ui/CopyField";
import { LangToggle } from "@/components/LangToggle";
import { parseTemplateMapping } from "@/lib/whatsapp/templates";

export default async function SettingsPage() {
  const ctx = await requireOwner();
  if (!ctx) return null;
  const lang = await getLang();
  const webhook = `${siteUrl()}/api/webhooks/whatsapp`;
  const hasToken = Boolean(ctx.business.whatsappToken);
  const templates = parseTemplateMapping(ctx.business.whatsappTemplatesJson);
  const templateFields: { usage: keyof typeof templates; label: string }[] = [
    { usage: "reminder_j1", label: t(lang, "waTemplateReminderJ1") },
    { usage: "new_appointment", label: t(lang, "waTemplateNewAppointment") },
    { usage: "handoff", label: t(lang, "waTemplateHandoff") },
    { usage: "cancelled", label: t(lang, "waTemplateCancelled") },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t(lang, "settings")} help={t(lang, "settingsHelp")} />

      <section className="card p-4 space-y-3">
        <p className="font-bold">{t(lang, "lang")}</p>
        <p className="text-muted">{t(lang, "langHelp")}</p>
        <LangToggle lang={lang} />
      </section>

      <form action={saveWhatsAppSettings} className="card p-4 space-y-4">
        <CopyField
          value={webhook}
          label={t(lang, "waAddress")}
          help={t(lang, "waAddressHelp")}
          copyLabel={t(lang, "copy")}
          copiedLabel={t(lang, "copied")}
        />
        <label className="block font-bold">
          {t(lang, "waKey")}
          <span className="block font-normal text-muted text-base mt-1">{t(lang, "waKeyHelp")}</span>
          <input
            name="whatsappToken"
            type="password"
            autoComplete="off"
            className="field mt-2"
            placeholder={hasToken ? t(lang, "waKeyKept") : ""}
          />
        </label>
        <label className="block font-bold">
          {t(lang, "waCode")}
          <span className="block font-normal text-muted text-base mt-1">{t(lang, "waCodeHelp")}</span>
          <input
            name="whatsappPhoneNumberId"
            defaultValue={ctx.business.whatsappPhoneNumberId}
            className="field mt-2"
            autoComplete="off"
          />
        </label>
        <div className="border-t pt-4 space-y-3">
          <p className="font-bold">{t(lang, "waTemplates")}</p>
          <p className="text-muted text-base">{t(lang, "waTemplatesHelp")}</p>
          {templateFields.map(({ usage, label }) => (
            <div key={usage} className="grid grid-cols-2 gap-2">
              <label className="block text-sm font-medium">
                {label} — {t(lang, "waTemplateName")}
                <input
                  name={`tpl_${usage}_name`}
                  defaultValue={templates[usage]?.name ?? ""}
                  className="field mt-1"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm font-medium">
                {t(lang, "waTemplateLang")}
                <input
                  name={`tpl_${usage}_lang`}
                  defaultValue={templates[usage]?.lang || "fr"}
                  className="field mt-1"
                  autoComplete="off"
                />
              </label>
            </div>
          ))}
        </div>
        <button className="btn btn-primary w-full">{t(lang, "save")}</button>
      </form>
    </div>
  );
}
