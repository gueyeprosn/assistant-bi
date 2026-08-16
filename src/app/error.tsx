"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center gap-4">
      <h1 className="text-2xl font-bold text-navy">Assistant Bi est temporairement indisponible</h1>
      <p className="text-muted max-w-md">
        Un problème technique est survenu. Vos données ne s’affichent pas ici. Réessayez dans un
        instant.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Réessayer
      </button>
    </div>
  );
}
