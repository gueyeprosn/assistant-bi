"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary w-full",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`${className} gap-2`} disabled={pending} aria-busy={pending} {...rest}>
      {pending && <span className="spinner" aria-hidden />}
      {children}
    </button>
  );
}
