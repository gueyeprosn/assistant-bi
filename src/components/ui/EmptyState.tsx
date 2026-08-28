import Link from "next/link";

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="px-4 py-10 text-center space-y-2">
      <p className="font-bold text-navy text-lg">{title}</p>
      {description ? <p className="text-muted">{description}</p> : null}
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="btn btn-ghost min-h-12 mt-2 inline-flex">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
