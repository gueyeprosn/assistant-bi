"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

const TOAST_KEYS = {
  saved: "toastSaved",
  sent: "toastSent",
  blocked: "toastBlocked",
  unblocked: "toastUnblocked",
  handoff_taken: "toastHandoffTaken",
  bot_resumed: "toastBotResumed",
  conv_closed: "toastConvClosed",
  payment_requested: "toastPaymentRequested",
  quote_created: "toastQuoteCreated",
  updated: "toastUpdated",
  done: "toastDone",
  no_show: "toastNoShow",
  cancelled: "toastCancelled",
} as const;

type ToastCode = keyof typeof TOAST_KEYS;

function isToastCode(value: string | null): value is ToastCode {
  return Boolean(value && value in TOAST_KEYS);
}

function ToastBubble({ text }: { text: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 pointer-events-none"
    >
      <div className="bg-navy text-white font-semibold rounded-xl px-4 py-3 shadow-lg pointer-events-auto max-w-[calc(100%-2rem)]">
        ✓ {text}
      </div>
    </div>
  );
}

export function Toast({ lang }: { lang: Lang }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const code = searchParams.get("ok");

  // Capture each new "ok" code into stable state (survives the URL cleanup below)
  // so the bubble keeps its own 3.5s lifetime instead of disappearing with the param.
  // `flip` alternates on every capture so two identical codes in a row still get a fresh key.
  const [seenParam, setSeenParam] = useState<string | null>(null);
  const [shown, setShown] = useState<{ flip: boolean; code: ToastCode } | null>(null);
  if (code !== seenParam) {
    setSeenParam(code);
    if (isToastCode(code)) {
      setShown((prev) => ({ flip: !prev?.flip, code }));
    }
  }

  useEffect(() => {
    if (!isToastCode(code)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ok");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!shown) return null;

  return <ToastBubble key={String(shown.flip)} text={t(lang, TOAST_KEYS[shown.code])} />;
}
