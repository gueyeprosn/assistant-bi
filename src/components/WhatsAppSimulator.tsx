"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Biz = { slug: string; name: string; neighborhood: string; category: string };
type Msg = { id: string; direction: string; text: string; createdAt: string };

const HINTS = [
  "Bonjour, vous êtes ouverts demain ?",
  "Où êtes-vous situé ?",
  "Combien coûtent les braids longues ?",
  "Je veux un rendez-vous demain à 14h",
  "Ma voiture a un problème de démarrage",
  "Fan ngeen nekk ?",
  "Ñaata lay jar tresses ?",
  "Dama bëgg rendez-vous suba",
  "Je veux parler au patron",
];

export function WhatsAppSimulator({
  initialBusinesses,
}: {
  initialBusinesses: Biz[];
}) {
  const [businesses] = useState(initialBusinesses);
  const [slug, setSlug] = useState(initialBusinesses[0]?.slug || "salon-awa");
  const [phone, setPhone] = useState("+221778888888");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string>("bot");
  const bottom = useRef<HTMLDivElement>(null);
  const biz = businesses.find((b) => b.slug === slug);

  const load = useCallback(async () => {
    const res = await fetch(`/api/demo/thread?slug=${slug}&phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setStatus(data.status || "bot");
  }, [slug, phone]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(value?: string) {
    const body = (value ?? text).trim();
    if (!body || pending) return;
    setText("");
    setPending(true);
    setMessages((m) => [
      ...m,
      {
        id: `tmp-${Date.now()}`,
        direction: "inbound",
        text: body,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, phone, text: body, name: "Client démo" }),
      });
      const data = await res.json();
      const replies: string[] = data.replies || [];
      setMessages((m) => [
        ...m,
        ...replies.map((t: string, i: number) => ({
          id: `bot-${Date.now()}-${i}`,
          direction: "outbound",
          text: t,
          createdAt: new Date().toISOString(),
        })),
      ]);
      if (data.handoff) setStatus("handoff");
    } finally {
      setPending(false);
      void load();
    }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start">
      <div className="rounded-[28px] overflow-hidden border border-line bg-[#111] max-w-[420px] mx-auto w-full">
        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
            {(biz?.name || "B").slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate text-sm">{biz?.name}</div>
            <div className="text-[11px] text-white/80">
              {status === "handoff" ? "Le patron a repris" : "en ligne — Assistant Bi"}
            </div>
          </div>
        </div>
        <div className="wa-pattern h-[520px] overflow-y-auto px-3 py-4 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-sm text-stone-600 bg-white/70 rounded-lg px-3 py-2 mx-8">
              Écrivez comme un client. Le bot répond en français ou en wolof.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] whitespace-pre-wrap text-[13.5px] leading-snug px-2.5 py-1.5 rounded-lg shadow-sm ${
                m.direction === "inbound"
                  ? "ml-auto bg-[#dcf8c6] rounded-tr-none"
                  : "bg-white rounded-tl-none"
              }`}
            >
              {m.text}
            </div>
          ))}
          {pending && (
            <div className="bg-white w-16 rounded-lg px-3 py-2 text-stone-400 text-sm">…</div>
          )}
          <div ref={bottom} />
        </div>
        <form
          className="bg-[#f0f0f0] p-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            className="flex-1 rounded-full px-4 py-2 text-sm bg-white outline-none"
          />
          <button
            type="submit"
            className="bg-[#075e54] text-white rounded-full h-10 w-10 text-sm font-bold"
          >
            →
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <label className="block font-bold">Commerce démo</label>
          <select
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setMessages([]);
            }}
            className="field"
          >
            {businesses.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name} — {b.neighborhood}
              </option>
            ))}
          </select>
          <label className="block font-bold">Votre n° client (simulé)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field"
          />
          <p className="text-xs text-muted">
            Après un rendez-vous, ouvrez le dashboard du salon (
            <code>77 111 11 11</code> / PIN <code>1234</code>) pour voir le créneau.
          </p>
        </div>
        <div className="card p-4">
          <p className="font-bold mb-2">Phrases à tester (démarchage)</p>
          <div className="flex flex-wrap gap-2">
            {HINTS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => void send(h)}
                className="text-left text-sm border-2 border-line rounded-xl px-3 py-2 min-h-12 hover:bg-navy hover:text-white hover:border-navy"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
