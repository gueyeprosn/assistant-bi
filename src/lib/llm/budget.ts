import { writeAudit } from "@/server/services/audit";

/** Estimation MVP gpt-4o-mini, compteur processus. */
const USD_PER_CALL = 0.002;
let monthKey = "";
let spentUsd = 0;
let warned80 = false;

function period() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}

function limitUsd() {
  const n = Number(process.env.LLM_MONTHLY_LIMIT_USD || "20");
  return Number.isFinite(n) && n > 0 ? n : 20;
}

export function llmBudgetAllows(): boolean {
  const p = period();
  if (p !== monthKey) {
    monthKey = p;
    spentUsd = 0;
    warned80 = false;
  }
  const cap = limitUsd();
  if (spentUsd >= cap) return false;
  if (!warned80 && spentUsd >= cap * 0.8) {
    warned80 = true;
    console.warn("[llm] 80 % du plafond mensuel atteint", { spentUsd, cap });
  }
  return true;
}

export function recordLlmCall(businessId?: string) {
  spentUsd += USD_PER_CALL;
  writeAudit({
    action: "llm_call",
    businessId: businessId ?? null,
    metadata: { costUsd: USD_PER_CALL, month: period() },
  }).catch(() => {});
}

export function llmSpendSnapshot() {
  return { spentUsd, limitUsd: limitUsd(), monthKey: period() };
}

