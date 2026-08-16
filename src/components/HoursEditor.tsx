"use client";

import { useState } from "react";
import { DAY_LABELS_FR, hourSelectOptions, type DayKey, type HoursMap } from "@/lib/hours";

export function HoursEditor({
  initial,
  label = "Horaires",
  closedLabel = "Fermé",
  help,
  openLabel = "Ouverture",
  closeLabel = "Fermeture",
}: {
  initial: HoursMap;
  label?: string;
  closedLabel?: string;
  help?: string;
  openLabel?: string;
  closeLabel?: string;
}) {
  const [hours, setHours] = useState<HoursMap>(initial);
  const ordered: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  function setDay(day: DayKey, open: boolean, start: string, end: string) {
    setHours((h) => ({
      ...h,
      [day]: open ? [[start, end]] : [],
    }));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="hoursJson" value={JSON.stringify(hours)} />
      <p className="font-bold">{label}</p>
      {help ? <p className="text-muted">{help}</p> : null}
      {ordered.map((day) => {
        const slot = hours[day]?.[0];
        const open = Boolean(slot);
        const start = slot?.[0] || "09:00";
        const end = slot?.[1] || "18:00";
        return (
          <div key={day} className="rounded-xl border border-line p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold">{DAY_LABELS_FR[day]}</p>
              <label className="flex items-center gap-2 font-bold min-h-12">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={!open}
                  onChange={(e) => setDay(day, !e.target.checked, start, end)}
                />
                {closedLabel}
              </label>
            </div>
            {open && (
              <div className="grid grid-cols-2 gap-2">
                <label className="block font-bold">
                  {openLabel}
                  <select
                    value={start}
                    onChange={(e) => setDay(day, true, e.target.value, end)}
                    className="field mt-1"
                    aria-label={`${DAY_LABELS_FR[day]} ${openLabel} GMT`}
                  >
                    {hourSelectOptions(start).map((hm) => (
                      <option key={`s-${hm}`} value={hm}>
                        {hm}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block font-bold">
                  {closeLabel}
                  <select
                    value={end}
                    onChange={(e) => setDay(day, true, start, e.target.value)}
                    className="field mt-1"
                    aria-label={`${DAY_LABELS_FR[day]} ${closeLabel} GMT`}
                  >
                    {hourSelectOptions(end).map((hm) => (
                      <option key={`e-${hm}`} value={hm}>
                        {hm}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
