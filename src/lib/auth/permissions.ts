export const ROLES = ["owner", "admin", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "business.read",
  "business.update",
  "appointments.write",
  "conversations.write",
  "billing.manage",
  "admin.read",
  "admin.impersonate",
  "admin.payment",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMS: Record<string, Permission[]> = {
  owner: [
    "business.read",
    "business.update",
    "appointments.write",
    "conversations.write",
    "billing.manage",
  ],
  staff: ["business.read", "appointments.write", "conversations.write"],
  admin: [
    "admin.read",
    "admin.impersonate",
    "admin.payment",
    "business.read",
  ],
};

export function hasPermission(role: string, permission: Permission) {
  return ROLE_PERMS[role]?.includes(permission) ?? false;
}
