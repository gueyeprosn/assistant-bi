"use client";

import { useMemo, useState } from "react";
import { createManualQuote } from "@/app/actions/business";
import { formatFcfa } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import { clampQuoteQty } from "@/lib/quotes";

type CatalogService = { id: string; name: string; priceFcfa: number };

type DraftLine = {
  key: string;
  serviceId?: string;
  name: string;
  qty: number;
  priceFcfa: number;
  custom?: boolean;
  saveService?: boolean;
};

export function QuoteComposer({
  lang,
  services,
}: {
  lang: Lang;
  services: CatalogService[];
}) {
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [saveNew, setSaveNew] = useState(true);
  const total = useMemo(
    () => lines.reduce((s, l) => s + l.qty * l.priceFcfa, 0),
    [lines],
  );

  function addService(service: CatalogService) {
    setLines((prev) => {
      const existing = prev.find((l) => l.serviceId === service.id);
      if (existing) {
        return prev.map((l) =>
          l.serviceId === service.id ? { ...l, qty: clampQuoteQty(l.qty + 1) } : l,
        );
      }
      if (prev.length >= 20) return prev;
      return [
        ...prev,
        {
          key: `s-${service.id}`,
          serviceId: service.id,
          name: service.name,
          qty: 1,
          priceFcfa: service.priceFcfa,
        },
      ];
    });
  }

  function addCustom() {
    const name = customName.trim().slice(0, 80);
    const priceFcfa = Math.round(Number(customPrice.replace(/\s/g, "")));
    if (!name || !Number.isFinite(priceFcfa) || priceFcfa < 0) return;
    setLines((prev) => {
      if (prev.length >= 20) return prev;
      return [
        ...prev,
        {
          key: `c-${Date.now()}`,
          name,
          qty: 1,
          priceFcfa,
          custom: true,
          saveService: saveNew,
        },
      ];
    });
    setCustomName("");
    setCustomPrice("");
  }

  function setQty(key: string, qty: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: clampQuoteQty(qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  return (
    <form action={createManualQuote} className="card p-4 space-y-4">
      <p className="font-bold text-lg">{t(lang, "createQuote")}</p>
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      <label className="block font-bold">
        {t(lang, "quotePhone")}
        <input name="phone" required inputMode="tel" placeholder="77 …" className="field mt-1" autoComplete="tel" />
      </label>
      <label className="block font-bold">
        {t(lang, "quoteClientName")}
        <input name="name" className="field mt-1" autoComplete="name" />
      </label>

      <fieldset>
        <legend className="font-bold mb-2">{t(lang, "quoteCatalog")}</legend>
        {services.length === 0 ? (
          <p className="text-muted">{t(lang, "quoteEmptyCatalog")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addService(s)}
                className="min-h-12 px-3 rounded-xl border-2 border-navy font-bold text-navy bg-white"
              >
                {s.name} — {formatFcfa(s.priceFcfa)}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <div className="space-y-2">
        <p className="font-bold">{t(lang, "quoteOther")}</p>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder={t(lang, "newService")}
          className="field"
          maxLength={80}
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            inputMode="numeric"
            placeholder={t(lang, "price")}
            className="field"
          />
          <button type="button" className="btn btn-gold" onClick={addCustom}>
            {t(lang, "quoteAddLine")}
          </button>
        </div>
        <label className="flex items-center gap-3 min-h-12 font-bold">
          <input
            type="checkbox"
            checked={saveNew}
            onChange={(e) => setSaveNew(e.target.checked)}
            className="h-5 w-5"
          />
          {t(lang, "quoteSaveService")}
        </label>
      </div>

      <div className="space-y-2">
        <p className="font-bold">{t(lang, "quoteArticles")}</p>
        {lines.length === 0 ? (
          <p className="text-muted">{t(lang, "quoteNeedLine")}</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li key={l.key} className="bg-soft rounded-xl px-3 py-3 space-y-2">
                <div className="flex justify-between gap-2 font-bold">
                  <span>{l.name}</span>
                  <span>{formatFcfa(l.qty * l.priceFcfa)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted">{t(lang, "quoteQty")}</span>
                  <button
                    type="button"
                    className="min-h-12 min-w-12 rounded-xl border-2 border-navy font-bold"
                    onClick={() => setQty(l.key, l.qty - 1)}
                    aria-label={t(lang, "quoteLess")}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center font-bold">{l.qty}</span>
                  <button
                    type="button"
                    className="min-h-12 min-w-12 rounded-xl border-2 border-navy font-bold"
                    onClick={() => setQty(l.key, l.qty + 1)}
                    aria-label={t(lang, "quoteMore")}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-auto font-bold text-navy min-h-12 px-2"
                    onClick={() => removeLine(l.key)}
                  >
                    {t(lang, "quoteRemove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xl font-bold text-navy">
          {t(lang, "quoteTotal")} : {formatFcfa(total)}
        </p>
      </div>

      <label className="block font-bold">
        {t(lang, "quoteNote")}
        <textarea name="note" rows={2} className="field mt-1 min-h-20" />
      </label>
      <button className="btn btn-primary w-full" disabled={lines.length === 0}>
        {t(lang, "makeQuote")}
      </button>
    </form>
  );
}
