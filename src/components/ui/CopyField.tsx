"use client";

import { useState } from "react";

export function CopyField({
  value,
  label,
  help,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  label: string;
  help?: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [ok, setOk] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setOk(true);
      window.setTimeout(() => setOk(false), 2000);
    } catch {
      setOk(false);
    }
  }

  return (
    <div>
      <p className="font-bold">{label}</p>
      {help ? <p className="text-muted text-base mt-1">{help}</p> : null}
      <div className="mt-2 flex gap-2">
        <input readOnly value={value} className="field text-base" />
        <button type="button" className="btn btn-gold shrink-0 px-4" onClick={copy}>
          {ok ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}
