"use client";

import { useState } from "react";
import { DAY_LABELS_FR, type DayKey, type HoursMap } from "@/lib/hours";

export function HoursEditor({
  initial,
  label = "Horaires",
  closedLabel = "Fermé",
}: {
  initial: HoursMap;
  label?: string;
  closedLabel?: string;
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
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setDay(day, true, e.target.value, end)}
                  className="field"
                />
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setDay(day, true, start, e.target.value)}
                  className="field"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
