export function MiniBars({
  title,
  items,
  caption,
}: {
  title: string;
  items: { label: string; value: number }[];
  caption?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="card p-4">
      <h2 className="text-lg font-bold text-navy mb-4">{title}</h2>
      <div className="flex items-end gap-2 h-32" role="img" aria-label={title}>
        {items.map((item) => {
          const bar = Math.round((item.value / max) * 100);
          return (
            <div key={item.label} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
              <span className="text-sm font-bold text-navy tabular-nums">{item.value}</span>
              <div className="w-full h-[72px] flex items-end bg-soft rounded-t-md overflow-hidden">
                <div
                  className="w-full bg-gold rounded-t-md min-h-1"
                  style={{ height: `${Math.max(item.value ? 8 : 4, bar)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted uppercase">{item.label}</span>
            </div>
          );
        })}
      </div>
      {caption ? <p className="text-sm text-muted mt-3">{caption}</p> : null}
    </section>
  );
}
