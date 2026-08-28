import { getServiceWindow } from "./window";

export type WhatsAppTemplateUsage = "reminder_j1" | "new_appointment" | "handoff" | "cancelled";

export type TemplateRef = { name: string; lang: string };

export type WhatsAppTemplateMapping = Partial<Record<WhatsAppTemplateUsage, TemplateRef>>;

export type SendMode =
  | { mode: "session" }
  | { mode: "template"; template: TemplateRef }
  | { mode: "skip"; reason: "no_template_configured" };

export function parseTemplateMapping(json: string): WhatsAppTemplateMapping {
  try {
    const parsed = JSON.parse(json || "{}") as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const mapping: WhatsAppTemplateMapping = {};
    for (const usage of ["reminder_j1", "new_appointment", "handoff", "cancelled"] as const) {
      const entry = (parsed as Record<string, unknown>)[usage];
      if (entry && typeof entry === "object") {
        const name = (entry as Record<string, unknown>).name;
        const lang = (entry as Record<string, unknown>).lang;
        if (typeof name === "string" && name.trim() && typeof lang === "string" && lang.trim()) {
          mapping[usage] = { name: name.trim(), lang: lang.trim() };
        }
      }
    }
    return mapping;
  } catch {
    return {};
  }
}

export function serializeTemplateMapping(mapping: WhatsAppTemplateMapping): string {
  return JSON.stringify(mapping);
}

export const TEMPLATE_USAGES: WhatsAppTemplateUsage[] = ["reminder_j1", "new_appointment", "handoff", "cancelled"];

/** Construit un mapping à partir de paires de champs `tpl_<usage>_name` / `tpl_<usage>_lang`. */
export function templateMappingFromFormEntries(get: (key: string) => string | null): WhatsAppTemplateMapping {
  const mapping: WhatsAppTemplateMapping = {};
  for (const usage of TEMPLATE_USAGES) {
    const name = (get(`tpl_${usage}_name`) || "").trim();
    const lang = (get(`tpl_${usage}_lang`) || "").trim();
    if (name && lang) mapping[usage] = { name, lang };
  }
  return mapping;
}

/** Décide session vs template vs skip pour un envoi donné. */
export async function resolveSendMode(
  businessId: string,
  recipientPhone: string,
  usage: WhatsAppTemplateUsage,
  templatesJson: string,
): Promise<SendMode> {
  const window = await getServiceWindow(businessId, recipientPhone);
  if (window.isOpen) return { mode: "session" };
  const mapping = parseTemplateMapping(templatesJson);
  const template = mapping[usage];
  if (!template) return { mode: "skip", reason: "no_template_configured" };
  return { mode: "template", template };
}
