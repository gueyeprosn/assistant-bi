import Link from "next/link";

export function KpiCard({
  value,
  label,
  href,
  detail,
  warn,
}: {
  value: string;
  label: string;
  href?: string;
  detail?: string;
  warn?: boolean;
}) {
  const inner = (
    <div className={`card p-4 min-h-[6.5rem] ${warn ? "border-gold bg-gold/10" : ""}`}>
      <div className="text-3xl sm:text-4xl font-bold text-navy tabular-nums leading-none">{value}</div>
      <div className="text-muted mt-2 font-semibold leading-snug">{label}</div>
      {detail ? <p className="text-sm text-muted mt-1 leading-snug">{detail}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
