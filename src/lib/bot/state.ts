export type ConvState = {
  mode: "idle" | "booking" | "quoting" | "handoff";
  booking?: {
    serviceId?: string;
    date?: string;
    time?: string;
  };
  quoting?: {
    need?: string;
    serviceIds: string[];
    asked: boolean;
  };
};

const ALLOWED: Record<ConvState["mode"], ConvState["mode"][]> = {
  idle: ["idle", "booking", "quoting", "handoff"],
  booking: ["booking", "idle", "handoff"],
  quoting: ["quoting", "idle", "handoff"],
  handoff: ["handoff", "idle"],
};

export function parseState(json: string): ConvState {
  try {
    const s = JSON.parse(json) as ConvState;
    return {
      mode: s.mode || "idle",
      booking: s.booking,
      quoting: s.quoting,
    };
  } catch {
    return { mode: "idle" };
  }
}

export function transition(from: ConvState, to: ConvState): ConvState {
  if (!ALLOWED[from.mode]?.includes(to.mode)) return from;
  return to;
}
