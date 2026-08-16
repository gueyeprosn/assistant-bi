"use client";

import { setLangAction } from "@/app/actions/lang";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  return (
    <div
      className="inline-flex rounded-xl border-2 border-navy overflow-hidden"
      role="group"
      aria-label="Langue"
    >
      <form action={setLangAction}>
        <input type="hidden" name="lang" value="fr" />
        <button
          type="submit"
          className={`min-h-12 min-w-12 px-3 text-sm font-bold cursor-pointer transition-colors duration-200 ${
            lang === "fr" ? "bg-gold text-navy" : "bg-white text-navy"
          }`}
        >
          FR
        </button>
      </form>
      <form action={setLangAction}>
        <input type="hidden" name="lang" value="wo" />
        <button
          type="submit"
          className={`min-h-12 min-w-12 px-3 text-sm font-bold cursor-pointer transition-colors duration-200 ${
            lang === "wo" ? "bg-gold text-navy" : "bg-white text-navy"
          }`}
        >
          WO
        </button>
      </form>
    </div>
  );
}
