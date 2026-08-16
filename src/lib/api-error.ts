import { ERRORS, type ErrorCode } from "./errors";

export function jsonError(code: ErrorCode, lang: "fr" | "wo" = "fr", status?: number) {
  const spec = ERRORS[code];
  return {
    body: {
      success: false as const,
      error: { code, message: spec[lang] },
    },
    status: status ?? spec.status,
  };
}

export function jsonOk<T extends Record<string, unknown>>(data: T) {
  return { success: true as const, ...data };
}
