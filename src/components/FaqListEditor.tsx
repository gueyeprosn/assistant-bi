"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type FaqRow = { q: string; r: string };

const MAX_FAQ = 20;
const emptyFaq = (): FaqRow => ({ q: "", r: "" });

export function FaqListEditor({
  lang,
  initial,
}: {
  lang: Lang;
  initial?: FaqRow[];
}) {
  const [rows, setRows] = useState<FaqRow[]>(
    initial && initial.length ? initial : [emptyFaq(), emptyFaq(), emptyFaq()],
  );

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-line p-3 space-y-2">
          <label className="block font-bold">
            {t(lang, "question")} {i + 1}
            <input
              name="faqQ"
              value={row.q}
              onChange={(e) =>
                setRows((list) => list.map((item, idx) => (idx === i ? { ...item, q: e.target.value } : item)))
              }
              placeholder={`${t(lang, "question")} ${i + 1}`}
              className="field mt-1"
            />
          </label>
          <label className="block font-bold">
            {t(lang, "answer")} {i + 1}
            <textarea
              name="faqR"
              rows={3}
              value={row.r}
              onChange={(e) =>
                setRows((list) => list.map((item, idx) => (idx === i ? { ...item, r: e.target.value } : item)))
              }
              placeholder={`${t(lang, "answer")} ${i + 1}`}
              className="field mt-1 min-h-24"
            />
          </label>
          {rows.length > 1 ? (
            <button
              type="button"
              className="font-bold text-navy min-h-12"
              onClick={() => setRows((list) => list.filter((_, idx) => idx !== i))}
            >
              {t(lang, "removeFaq")}
            </button>
          ) : null}
        </div>
      ))}
      {rows.length < MAX_FAQ ? (
        <button
          type="button"
          className="btn btn-ghost w-full"
          onClick={() => setRows((list) => [...list, emptyFaq()])}
        >
          {t(lang, "addFaq")}
        </button>
      ) : null}
    </div>
  );
}
