import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { handleInbound } from "@/lib/bot/engine";
import { cloudAdapter } from "@/lib/whatsapp/cloud";
import { downloadAndTranscribeWhatsAppAudio } from "@/lib/whatsapp/audio";
import { errorJson, limitedJson } from "@/lib/http";
import { normalizeSnPhone } from "@/lib/phone";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

type WaChange = {
  value?: {
    metadata?: { phone_number_id?: string; display_phone_number?: string };
    messages?: {
      from?: string;
      id?: string;
      type?: string;
      text?: { body?: string };
      button?: { text?: string };
      audio?: { id?: string; mime_type?: string; voice?: boolean };
      voice?: { id?: string; mime_type?: string };
    }[];
    contacts?: { wa_id?: string; profile?: { name?: string } }[];
  };
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = limitedJson(`wa:${ip}`, 60, 60_000);
  if (limited) return limited;
  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    return errorJson("WHATSAPP_NOT_CONFIGURED");
  }
  const raw = await req.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const header = req.headers.get("x-hub-signature-256");
    if (!metaSignatureOk(raw, header, appSecret)) {
      return errorJson("WEBHOOK_INVALID_SIGNATURE");
    }
  }
  let payload: { entry?: { changes?: WaChange[] }[] } | null = null;
  try {
    payload = JSON.parse(raw || "null") as { entry?: { changes?: WaChange[] }[] } | null;
  } catch {
    return NextResponse.json({ success: true });
  }
  if (!payload) return NextResponse.json({ success: true });

  const changes = payload.entry?.flatMap((e) => e.changes || []) ?? [];
  for (const change of changes) {
    const value = change.value;
    const messages = value?.messages ?? [];
    if (!messages.length) continue;

    const phoneNumberId = value?.metadata?.phone_number_id;
    const display = value?.metadata?.display_phone_number;
    const business = await findBusinessForWaNumber(phoneNumberId, display);
    if (!business) {
      console.warn("[whatsapp] aucun commerce pour phoneNumberId:", phoneNumberId, "display:", display);
      continue;
    }

    for (const msg of messages) {
      if (!msg.from || !msg.id) continue;

      let text = msg.text?.body || msg.button?.text;

      // Handle voice/audio messages via Whisper transcription
      if (!text && (msg.type === "audio" || msg.type === "voice")) {
        const mediaId = msg.audio?.id || msg.voice?.id;
        if (mediaId) {
          const transcribed = await downloadAndTranscribeWhatsAppAudio({
            mediaId,
            token: business.whatsappToken || process.env.WHATSAPP_ACCESS_TOKEN,
          });
          if (transcribed) {
            text = transcribed;
          } else {
            text =
              business.defaultLang === "wo"
                ? "Dama laaj dimbali ci rendez-vous walla tarif."
                : "Bonjour, je souhaite des informations.";
          }
        }
      }

      if (!text) continue;

      const hash = createHash("sha256").update(raw).digest("hex");
      try {
        await prisma.webhookEvent.create({
          data: {
            provider: "whatsapp",
            externalId: msg.id,
            payloadHash: hash,
            status: "received",
          },
        });
      } catch {
        continue;
      }
      const name = value?.contacts?.[0]?.profile?.name;
      const result = await handleInbound({
        businessId: business.id,
        customerPhone: normalizeSnPhone(msg.from),
        customerName: name,
        text,
      });
      try {
        for (const reply of result.replies) {
          await cloudAdapter.sendText(normalizeSnPhone(msg.from), reply, business.id);
        }
      } catch {
        if (result.conversationId) {
          await prisma.message.updateMany({
            where: {
              conversationId: result.conversationId,
              direction: "outbound",
              createdAt: { gte: new Date(Date.now() - 15_000) },
            },
            data: { deliveryStatus: "failed" },
          });
        }
      }
      await prisma.webhookEvent.updateMany({
        where: { provider: "whatsapp", externalId: msg.id },
        data: { status: "processed", processedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ success: true });
}

async function findBusinessForWaNumber(phoneNumberId?: string, display?: string) {
  if (phoneNumberId) {
    const biz = await prisma.business.findFirst({
      where: { whatsappPhoneNumberId: phoneNumberId },
    });
    if (biz) return biz;
  }
  if (display) {
    const phone = normalizeSnPhone(display);
    const biz = await prisma.business.findFirst({
      where: {
        OR: [{ ownerPhone: phone }, { secondaryPhone: phone }],
      },
    });
    if (biz) return biz;
  }
  const only = await prisma.business.findMany({ take: 2 });
  return only.length === 1 ? only[0] : null;
}

function metaSignatureOk(raw: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const given = header.slice("sha256=".length);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
