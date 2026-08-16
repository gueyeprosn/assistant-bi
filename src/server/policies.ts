import type { SessionPayload } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

export class ForbiddenError extends Error {
  constructor(message = "Accès refusé") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Jamais faire confiance à un businessId fourni par le client. */
export function assertSameBusiness(sessionBusinessId: string | null | undefined, resourceBusinessId: string) {
  if (!sessionBusinessId || sessionBusinessId !== resourceBusinessId) {
    throw new ForbiddenError();
  }
}

export function requirePermission(role: string, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }
}

export function sessionBusinessId(session: SessionPayload) {
  return session.businessId;
}
