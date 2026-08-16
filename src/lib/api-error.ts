export function jsonError(code: string, message: string, status = 400) {
  return {
    body: {
      success: false as const,
      error: { code, message },
    },
    status,
  };
}

export function jsonOk<T extends Record<string, unknown>>(data: T) {
  return { success: true as const, ...data };
}
