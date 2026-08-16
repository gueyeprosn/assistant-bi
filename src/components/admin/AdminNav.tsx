"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Vue d’ensemble" },
  { href: "/admin/commerces", label: "Commerces" },
  { href: "/admin/paiements", label: "Paiements" },
  { href: "/admin/activite", label: "Activité" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/systeme", label: "Système" },
  { href: "/admin/support", label: "Support" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex lg:flex-col gap-1 overflow-x-auto px-4 lg:px-0 lg:py-6 border-b lg:border-b-0 lg:border-r border-line bg-white">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 min-h-12 px-4 inline-flex items-center font-bold rounded-xl ${
              active ? "bg-navy text-white" : "text-navy hover:bg-soft"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
