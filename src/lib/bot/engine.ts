import type { Business, Service } from "@prisma/client";
import { prisma } from "../db";
import { findAvailableSlots, isSlotFree, countAppointmentsThisMonth } from "../calendar";
import { formatDate, formatFcfa, formatTime, toYmd } from "../format";
import { formatHoursCompact, parseHours } from "../hours";
import { canUseQuotes, rdvLimit } from "../plans";
import { buildQuoteText, type QuoteLine } from "../quotes";
import { atTimeOnDate } from "../hours";
import { classifyIntent, type Intent } from "./intents";
import { detectLanguage, type Lang } from "./language";
import { parseWhen } from "./parser";
import { parseState, transition, type ConvState } from "./state";
import { bookSlot } from "@/server/services/booking";
import { writeAudit } from "@/server/services/audit";
import { llmClassify, llmEnabled, llmPolish } from "../llm/client";
import { factsBlock } from "../llm/prompts";
import { BOT_TECHNICAL_FR } from "../errors";

type Biz = Business & { services: Service[] };

export async function handleInbound(opts: {
  businessId: string;
  customerPhone: string;
  customerName?: string;
  text: string;
}): Promise<{ replies: string[]; conversationId: string; handoff: boolean }> {
  try {
    return await handleInboundUnsafe(opts);
  } catch {
    return {
      replies: [BOT_TECHNICAL_FR],
      conversationId: "",
      handoff: false,
    };
  }
}

async function handleInboundUnsafe(opts: {
  businessId: string;
  customerPhone: string;
  customerName?: string;
  text: string;
}): Promise<{ replies: string[]; conversationId: string; handoff: boolean }> {
  const business = await prisma.business.findUnique({
    where: { id: opts.businessId },
    include: { services: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!business) return { replies: ["Service indisponible."], conversationId: "", handoff: false };

  if (business.status === "suspended" || business.status === "cancelled") {
    const msg =
      "Ce numéro n'accepte plus les messages automatiques pour le moment. Merci de rappeler plus tard.";
    return { replies: [msg], conversationId: "", handoff: false };
  }

  const customer = await prisma.customer.upsert({
    where: {
      businessId_phone: { businessId: business.id, phone: opts.customerPhone },
    },
    create: {
      businessId: business.id,
      phone: opts.customerPhone,
      name: opts.customerName,
      language: detectLanguage(opts.text),
    },
    update: opts.customerName ? { name: opts.customerName } : {},
  });

  let conversation = await prisma.conversation.findFirst({
    where: {
      businessId: business.id,
      customerId: customer.id,
      status: { in: ["bot", "handoff"] },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { businessId: business.id, customerId: customer.id, status: "bot" },
    });
  }

  const lang = detectLanguage(opts.text);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { language: lang },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      text: opts.text,
      language: lang,
    },
  });

  if (conversation.status === "handoff") {
    return { replies: [], conversationId: conversation.id, handoff: true };
  }

  const { replies, next, summary, intent } = await runEngine({
    business,
    customerName: customer.name,
    conversationId: conversation.id,
    customerId: customer.id,
    text: opts.text,
    lang,
    state: parseState(conversation.stateJson),
  });

  for (const text of replies) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "outbound",
        text,
        language: lang,
      },
    });
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      stateJson: JSON.stringify(next),
      status: next.mode === "handoff" ? "handoff" : "bot",
      summary: summary ?? conversation.summary,
      lastIntent: intent,
      language: lang,
    },
  });

  if (next.mode === "handoff" && conversation.status !== "handoff") {
    await writeAudit({
      action: "handoff",
      businessId: business.id,
      metadata: { conversationId: conversation.id, intent },
    });
  }

  return {
    replies,
    conversationId: conversation.id,
    handoff: next.mode === "handoff",
  };
}

async function runEngine(ctx: {
  business: Biz;
  customerName: string | null;
  conversationId: string;
  customerId: string;
  text: string;
  lang: Lang;
  state: ConvState;
}): Promise<{ replies: string[]; next: ConvState; summary?: string; intent: Intent }> {
  let intent = classifyIntent(ctx.text).intent;
  if (llmEnabled() && intent === "other") {
    const llm = await llmClassify(ctx.text);
    if (llm) intent = llm.intent;
  }

  const wrap = async (result: { replies: string[]; next: ConvState; summary?: string }) => ({
    ...result,
    next: transition(ctx.state, result.next),
    intent,
  });

  if (ctx.state.mode === "booking" && intent !== "cancel" && intent !== "human") {
    return wrap(await continueBooking(ctx, intent));
  }
  if (ctx.state.mode === "quoting" && intent !== "cancel" && intent !== "human") {
    return wrap(await continueQuote(ctx));
  }

  switch (intent) {
    case "greeting":
      return wrap({
        replies: [await maybePolish(ctx, greet(ctx.business, ctx.lang))],
        next: { mode: "idle" },
      });
    case "hours":
      return wrap({
        replies: [await maybePolish(ctx, hoursReply(ctx.business, ctx.lang))],
        next: { mode: "idle" },
      });
    case "location":
      return wrap({
        replies: [await maybePolish(ctx, locationReply(ctx.business, ctx.lang))],
        next: { mode: "idle" },
      });
    case "prices":
      return wrap({
        replies: [await maybePolish(ctx, pricesReply(ctx.business, ctx.lang, ctx.text))],
        next: { mode: "idle" },
      });
    case "availability":
    case "book":
      return wrap(await startBooking(ctx));
    case "cancel":
      return wrap(await cancelLatest(ctx));
    case "quote":
      return wrap(await startQuote(ctx));
    case "human":
      return wrap(handoff(ctx));
    case "thanks":
      return wrap({
        replies: [
          ctx.lang === "wo"
            ? "Jërëjëf ! Su la soxlaat, waxal ma."
            : "Avec plaisir. N'hésitez pas si vous avez besoin d'un rendez-vous.",
        ],
        next: { mode: "idle" },
      });
    case "confirm":
      return wrap(await startBooking(ctx));
    default:
      return wrap(unknown(ctx));
  }
}

function greet(b: Biz, lang: Lang) {
  return lang === "wo"
    ? b.greetingWo || `Asalaam aleekum, ${b.name} la. Man Assistant Bi laa.`
    : b.greetingFr ||
        `Bonjour, ici ${b.name}. Je suis Assistant Bi, je peux vous donner les horaires, les tarifs ou prendre rendez-vous.`;
}

function hoursReply(b: Biz, lang: Lang) {
  const text = formatHoursCompact(parseHours(b.hoursJson));
  return lang === "wo"
    ? `Waxtu yu ${b.name} :\n${text}`
    : `Horaires de ${b.name} :\n${text}`;
}

function locationReply(b: Biz, lang: Lang) {
  return lang === "wo"
    ? `${b.name} nekk na ${b.address} (${b.neighborhood}).`
    : `Nous sommes au ${b.address}, ${b.neighborhood}.`;
}

function matchServices(services: Service[], text: string): Service[] {
  const t = text.toLowerCase();
  const hits = services.filter((s) => {
    const keys: string[] = JSON.parse(s.keywordsJson || "[]");
    return (
      t.includes(s.name.toLowerCase()) ||
      keys.some((k) => t.includes(k.toLowerCase()))
    );
  });
  return hits;
}

function pricesReply(b: Biz, lang: Lang, text: string) {
  const matched = matchServices(b.services, text);
  const list = (matched.length ? matched : b.services)
    .map((s) => `• ${s.name} — ${formatFcfa(s.priceFcfa)} (${s.durationMin} min)`)
    .join("\n");
  return lang === "wo"
    ? `Tarif yi :\n${list}\n\nDama mën a jëlal rendez-vous si nga bëgg.`
    : `Nos tarifs :\n${list}\n\nJe peux aussi vous prendre un rendez-vous.`;
}

async function startBooking(ctx: {
  business: Biz;
  text: string;
  lang: Lang;
  customerId: string;
  conversationId: string;
  customerName: string | null;
  state: ConvState;
}) {
  const when = parseWhen(ctx.text);
  const matched = matchServices(ctx.business.services, ctx.text);
  const service = matched[0];
  const duration = service?.durationMin ?? ctx.business.defaultDurationMin;
  const booking: ConvState["booking"] = {
    serviceId: service?.id,
    date: when.date ? toYmd(when.date) : undefined,
    time: when.time,
  };

  if (booking.date && booking.time) {
    return finishBooking(ctx, booking, duration);
  }

  const from = when.date ?? new Date();
  const slots = await findAvailableSlots({
    businessId: ctx.business.id,
    hoursJson: ctx.business.hoursJson,
    slotStepMin: ctx.business.slotStepMin,
    durationMin: duration,
    from,
    limit: 4,
  });
  if (!slots.length) {
    return {
      replies: [
        ctx.lang === "wo"
          ? "Amul benn créneau ci 14 jours. Dama mën a wax ak patron bi."
          : "Aucun créneau n'est libre sur les 14 prochains jours. Je transfère au professionnel.",
      ],
      next: { mode: "handoff" } as ConvState,
      summary: "Demande de rendez-vous sans créneau disponible.",
    };
  }
  const lines = slots
    .map((s, i) => `${i + 1}. ${formatDate(s.start)} à ${formatTime(s.start)}`)
    .join("\n");
  const intro = service
    ? ctx.lang === "wo"
      ? `Pour ${service.name}, créneau yu am :`
      : `Pour ${service.name}, voici les prochains créneaux :`
    : ctx.lang === "wo"
      ? "Créneau yu am :"
      : "Voici les prochains créneaux disponibles :";
  return {
    replies: [
      `${intro}\n${lines}\n\n${ctx.lang === "wo" ? "Tegal numéro bi walla waxtu wi nga bëgg." : "Répondez avec le numéro du créneau, ou proposez un jour et une heure."}`,
    ],
    next: { mode: "booking", booking } as ConvState,
  };
}

async function continueBooking(
  ctx: {
    business: Biz;
    text: string;
    lang: Lang;
    customerId: string;
    conversationId: string;
    customerName: string | null;
    state: ConvState;
  },
  intent: Intent,
): Promise<{ replies: string[]; next: ConvState; summary?: string }> {
  const booking = { ...(ctx.state.booking || {}) };
  const num = ctx.text.trim().match(/^([1-4])\b/);
  if (num) {
    const duration =
      ctx.business.services.find((s) => s.id === booking.serviceId)?.durationMin ??
      ctx.business.defaultDurationMin;
    const from = booking.date ? new Date(`${booking.date}T00:00:00`) : new Date();
    const slots = await findAvailableSlots({
      businessId: ctx.business.id,
      hoursJson: ctx.business.hoursJson,
      slotStepMin: ctx.business.slotStepMin,
      durationMin: duration,
      from,
      limit: 4,
    });
    const slot = slots[parseInt(num[1], 10) - 1];
    if (slot) {
      booking.date = toYmd(slot.start);
      booking.time = formatTime(slot.start).replace(":", "h").includes("h")
        ? `${String(slot.start.getHours()).padStart(2, "0")}:${String(slot.start.getMinutes()).padStart(2, "0")}`
        : `${String(slot.start.getHours()).padStart(2, "0")}:${String(slot.start.getMinutes()).padStart(2, "0")}`;
      booking.time = `${String(slot.start.getHours()).padStart(2, "0")}:${String(slot.start.getMinutes()).padStart(2, "0")}`;
      return finishBooking(ctx, booking, duration);
    }
  }
  const when = parseWhen(ctx.text);
  if (when.date) booking.date = toYmd(when.date);
  if (when.time) booking.time = when.time;
  const matched = matchServices(ctx.business.services, ctx.text);
  if (matched[0]) booking.serviceId = matched[0].id;

  if (intent === "deny") {
    return {
      replies: [
        ctx.lang === "wo"
          ? "Baax na. Su la soxlaat rendez-vous, waxal ma."
          : "D'accord, je n'enregistre rien. Dites-moi quand vous voulez venir.",
      ],
      next: { mode: "idle" },
    };
  }

  const duration =
    ctx.business.services.find((s) => s.id === booking.serviceId)?.durationMin ??
    ctx.business.defaultDurationMin;
  if (booking.date && booking.time) {
    return finishBooking(ctx, booking, duration);
  }
  return startBooking({ ...ctx, state: { mode: "booking", booking } });
}

async function finishBooking(
  ctx: {
    business: Biz;
    lang: Lang;
    customerId: string;
    customerName: string | null;
  },
  booking: NonNullable<ConvState["booking"]>,
  duration: number,
): Promise<{ replies: string[]; next: ConvState; summary?: string }> {
  if (!booking.date || !booking.time) {
    return { replies: ["Indiquez le jour et l'heure."], next: { mode: "booking", booking } };
  }
  const start = atTimeOnDate(new Date(`${booking.date}T12:00:00`), booking.time);
  const end = new Date(start.getTime() + duration * 60_000);
  const free = await isSlotFree(ctx.business.id, start, end);
  if (!free) {
    const alts = await findAvailableSlots({
      businessId: ctx.business.id,
      hoursJson: ctx.business.hoursJson,
      slotStepMin: ctx.business.slotStepMin,
      durationMin: duration,
      from: start,
      limit: 3,
    });
    const lines = alts.map((s) => `• ${formatDate(s.start)} à ${formatTime(s.start)}`).join("\n");
    return {
      replies: [
        ctx.lang === "wo"
          ? `Créneau bii dafa am. Am na yeneen :\n${lines}`
          : `Ce créneau n'est plus libre. Voici des alternatives :\n${lines}`,
      ],
      next: { mode: "booking", booking: { ...booking, time: undefined } },
    };
  }

  const limit = rdvLimit(ctx.business.plan, ctx.business.status);
  if (limit) {
    const n = await countAppointmentsThisMonth(ctx.business.id);
    if (n >= limit) {
      // still book, owner sees the cap in dashboard
    }
  }

  const service = ctx.business.services.find((s) => s.id === booking.serviceId);
  const booked = await bookSlot({
    businessId: ctx.business.id,
    customerId: ctx.customerId,
    serviceId: service?.id,
    startsAt: start,
    endsAt: end,
    notes: service?.name,
  });
  if (!booked.ok) {
    const alts = await findAvailableSlots({
      businessId: ctx.business.id,
      hoursJson: ctx.business.hoursJson,
      slotStepMin: ctx.business.slotStepMin,
      durationMin: duration,
      from: start,
      limit: 3,
    });
    const lines = alts.map((s) => `• ${formatDate(s.start)} à ${formatTime(s.start)}`).join("\n");
    return {
      replies: [
        ctx.lang === "wo"
          ? `Créneau bii dafa am. Am na yeneen :\n${lines}`
          : `Ce créneau n'est plus libre. Voici des alternatives :\n${lines}`,
      ],
      next: { mode: "booking", booking: { ...booking, time: undefined } },
    };
  }

  const svc = service ? ` (${service.name})` : "";
  return {
    replies: [
      ctx.lang === "wo"
        ? `Rendez-vous bi jàll na : ${formatDate(start)} ci ${formatTime(start)}${svc}.\nDinaa la fàttali bés bu njëkk. Jërëjëf !`
        : `C'est noté : ${formatDate(start)} à ${formatTime(start)}${svc}.\nJe vous enverrai un rappel la veille. À bientôt chez ${ctx.business.name}.`,
    ],
    next: { mode: "idle" },
    summary: `RDV confirmé ${formatDate(start)} ${formatTime(start)}${svc}`,
  };
}

async function cancelLatest(ctx: {
  business: Biz;
  customerId: string;
  lang: Lang;
}) {
  const appt = await prisma.appointment.findFirst({
    where: {
      businessId: ctx.business.id,
      customerId: ctx.customerId,
      status: { in: ["booked", "reminded"] },
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
  });
  if (!appt) {
    return {
      replies: [
        ctx.lang === "wo"
          ? "Amuma rendez-vous bu ñu mën a dindi."
          : "Je ne trouve pas de rendez-vous à venir à annuler.",
      ],
      next: { mode: "idle" as const },
    };
  }
  await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: "cancelled", cancelledAt: new Date(), cancelReason: "client" },
  });
  return {
    replies: [
      ctx.lang === "wo"
        ? `Rendez-vous ${formatDate(appt.startsAt)} ${formatTime(appt.startsAt)} dindi naa ko. Créneau bi dafa ubbeeku.`
        : `Le rendez-vous du ${formatDate(appt.startsAt)} à ${formatTime(appt.startsAt)} est annulé. Le créneau est à nouveau libre.`,
    ],
    next: { mode: "idle" as const },
  };
}

async function startQuote(ctx: {
  business: Biz;
  text: string;
  lang: Lang;
  customerId: string;
  conversationId: string;
  customerName: string | null;
}) {
  if (!canUseQuotes(ctx.business.plan, ctx.business.status)) {
    return {
      replies: [
        ctx.lang === "wo"
          ? "Devis bi, patron bi moo koy def. Dama lay joxal."
          : "Pour un devis, je passe la conversation au professionnel.",
      ],
      next: { mode: "handoff" as const },
      summary: `Demande de devis : ${ctx.text}`,
    };
  }
  const matched = matchServices(ctx.business.services, ctx.text);
  if (matched.length) {
    return sendQuote(ctx, matched, ctx.text);
  }
  const list = ctx.business.services.map((s) => `• ${s.name}`).join("\n");
  return {
    replies: [
      ctx.lang === "wo"
        ? `Waxal ma lu nga bëgg (exemple : ${ctx.business.services[0]?.name ?? "prestation"}).\n${list}`
        : `Je prépare un devis. Quelle prestation vous intéresse ?\n${list}`,
    ],
    next: {
      mode: "quoting" as const,
      quoting: { need: ctx.text, serviceIds: [], asked: true },
    },
  };
}

async function continueQuote(ctx: {
  business: Biz;
  text: string;
  lang: Lang;
  customerId: string;
  conversationId: string;
  customerName: string | null;
  state: ConvState;
}): Promise<{ replies: string[]; next: ConvState; summary?: string }> {
  if (classifyIntent(ctx.text).intent === "human") return handoff(ctx);
  const matched = matchServices(ctx.business.services, ctx.text);
  if (!matched.length) {
    return {
      replies: [
        ctx.lang === "wo"
          ? "Dégguma. Mën nga tegal turu prestation bi, walla wax ak patron bi."
          : "Je n'ai pas identifié la prestation. Donnez le nom (ou dites « patron » pour parler au professionnel).",
      ],
      next: ctx.state,
    };
  }
  return sendQuote(ctx, matched, ctx.state.quoting?.need || ctx.text);
}

async function sendQuote(
  ctx: {
    business: Biz;
    lang: Lang;
    customerId: string;
    conversationId: string;
    customerName: string | null;
  },
  services: Service[],
  need: string,
) {
  const lines: QuoteLine[] = services.map((s) => ({
    name: s.name,
    qty: 1,
    priceFcfa: s.priceFcfa,
  }));
  const { text, total } = buildQuoteText({
    businessName: ctx.business.name,
    customerName: ctx.customerName,
    lines,
    lang: ctx.lang,
  });
  await prisma.quote.create({
    data: {
      businessId: ctx.business.id,
      customerId: ctx.customerId,
      conversationId: ctx.conversationId,
      linesJson: JSON.stringify(lines),
      totalFcfa: total,
      status: "sent",
      textBody: text,
    },
  });
  return {
    replies: [text],
    next: { mode: "idle" as const },
    summary: `Devis envoyé (${formatFcfa(total)}) : ${need}`,
  };
}

function handoff(ctx: {
  text: string;
  lang: Lang;
  business: Biz;
}): { replies: string[]; next: ConvState; summary?: string } {
  const summary = `Le client demande à parler au patron. Dernier message : « ${ctx.text} ».`;
  return {
    replies: [
      ctx.lang === "wo"
        ? `Baax na. Dama lay joxal ${ctx.business.name}. Dinañu la tontu ci kanam.`
        : `Je vais transmettre votre demande à mon responsable. Un instant s'il vous plaît.`,
    ],
    next: { mode: "handoff" },
    summary,
  };
}

function unknown(ctx: { business: Biz; lang: Lang; text: string }) {
  const help =
    ctx.lang === "wo"
      ? `Mën naa la dimbali ci :\n• waxtu / adresse\n• tarif\n• rendez-vous\n• devis\nWalla tegal « patron ».`
      : `Je peux vous aider pour :\n• les horaires et l'adresse\n• les tarifs\n• un rendez-vous\n• un devis simple\nOu écrivez « patron » pour parler au professionnel.`;
  return {
    replies: [help],
    next: { mode: "idle" as const },
    summary: `Message non classé : ${ctx.text}`,
  };
}

export function polishIsFactSafe(draft: string, polished: string) {
  const nums = (s: string) =>
    Array.from(s.matchAll(/\d{3,}/g)).map((m) => m[0].replace(/\s/g, ""));
  const allowed = new Set(nums(draft));
  return nums(polished).every((n) => allowed.has(n));
}

async function maybePolish(
  ctx: { business: Biz; text: string; lang: Lang },
  draft: string,
): Promise<string> {
  if (!llmEnabled()) return draft;
  const facts = factsBlock({
    businessName: ctx.business.name,
    address: `${ctx.business.address}, ${ctx.business.neighborhood}`,
    hoursText: formatHoursCompact(parseHours(ctx.business.hoursJson)),
    servicesText: ctx.business.services
      .map((s) => `${s.name}: ${s.priceFcfa} FCFA`)
      .join("\n"),
    lang: ctx.lang,
  });
  const polished = await llmPolish({
    facts,
    userMessage: ctx.text,
    draft,
    lang: ctx.lang,
  });
  if (!polished) return draft;
  if (!polishIsFactSafe(draft, polished)) return draft;
  return polished;
}
