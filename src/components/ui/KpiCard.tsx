import Link from "next/link";

export function KpiCard({
  value,
  label,
  href,
}: {
  value: string;
  label: string;
  href?: string;
}) {
  const inner = (
    <div className="card p-4 min-h-[6.5rem]">
      <div className="text-4xl font-bold text-navy tabular-nums leading-none">{value}</div>
      <div className="text-muted mt-2 font-semibold leading-snug">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
