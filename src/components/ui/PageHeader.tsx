export function PageHeader({
  title,
  help,
}: {
  title: string;
  help?: string;
}) {
  return (
    <header>
      <h1 className="text-[1.75rem] sm:text-3xl font-bold text-navy leading-tight">{title}</h1>
      {help ? <p className="text-muted mt-2 text-base leading-relaxed">{help}</p> : null}
    </header>
  );
}
