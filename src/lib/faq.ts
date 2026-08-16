export type FaqItem = { q: string; r: string };

export function parseFaq(json: string | null | undefined): FaqItem[] {
  try {
    const raw = JSON.parse(json || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        const row = item as { q?: unknown; r?: unknown };
        return { q: String(row.q ?? "").trim(), r: String(row.r ?? "").trim() };
      })
      .filter((item) => item.q.length >= 3 && item.r.length >= 3);
  } catch {
    return [];
  }
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function significantWords(text: string) {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length >= 4);
}

export function matchFaq(items: FaqItem[], text: string): FaqItem | null {
  const words = significantWords(text);
  if (!words.length || !items.length) return null;
  let best: FaqItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const qWords = significantWords(item.q);
    if (!qWords.length) continue;
    const score = qWords.filter((w) => words.includes(w) || text.toLowerCase().includes(w)).length;
    const ratio = score / qWords.length;
    if (score >= 2 || ratio >= 0.6) {
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
  }
  return best;
}

export function parseFaqFields(questions: string[], answers: string[]): FaqItem[] {
  const out: FaqItem[] = [];
  const n = Math.max(questions.length, answers.length);
  for (let i = 0; i < n; i++) {
    const q = String(questions[i] || "").trim();
    const r = String(answers[i] || "").trim();
    if (q.length >= 3 && r.length >= 3) out.push({ q, r });
  }
  return out;
}
