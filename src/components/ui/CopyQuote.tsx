"use client";

import { useState } from "react";

export function CopyQuote({
  text,
  phone,
  copyLabel,
  copiedLabel,
  sendLabel,
}: {
  text: string;
  phone?: string;
  copyLabel: string;
  copiedLabel: string;
  sendLabel: string;
}) {
  const [ok, setOk] = useState(false);
  const digits = (phone || "").replace(/\D/g, "");
  const waHref = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      window.setTimeout(() => setOk(false), 2000);
    } catch {
      setOk(false);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button type="button" className="btn btn-ghost w-full" onClick={copy}>
        {ok ? copiedLabel : copyLabel}
      </button>
      {waHref ? (
        <a href={waHref} className="btn btn-gold w-full" target="_blank" rel="noreferrer">
          {sendLabel}
        </a>
      ) : null}
    </div>
  );
}
