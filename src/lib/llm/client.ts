import { INTENT_PROMPT, SYSTEM_PROMPT } from "./prompts";
import type { Intent } from "../bot/intents";
import type { Lang } from "../bot/language";
import { llmBudgetAllows, recordLlmCall } from "./budget";

const TIMEOUT_MS = 3000;

export function llmEnabled() {
  return Boolean(process.env.OPENAI_API_KEY) && llmBudgetAllows();
}

async function chat(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !llmBudgetAllows()) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    recordLlmCall();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function llmPolish(opts: {
  facts: string;
  userMessage: string;
  draft: string;
  lang: Lang;
}): Promise<string | null> {
  return chat([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `${opts.facts}\n\nMessage client : ${opts.userMessage}\n\nBrouillon à reformuler sans changer les faits (prix, heures, adresses) :\n${opts.draft}\n\nRéponds uniquement le message final WhatsApp.`,
    },
  ]);
}

export async function llmClassify(
  text: string,
): Promise<{ intent: Intent; language: Lang } | null> {
  const raw = await chat([
    { role: "system", content: INTENT_PROMPT },
    { role: "user", content: text },
  ]);
  if (!raw) return null;
  try {
    const json = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(json) as { intent?: string; language?: string };
    return {
      intent: (parsed.intent as Intent) || "other",
      language: parsed.language === "wo" ? "wo" : "fr",
    };
  } catch {
    return null;
  }
}
