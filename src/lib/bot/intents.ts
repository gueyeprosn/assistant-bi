export type Intent =
  | "greeting"
  | "hours"
  | "location"
  | "prices"
  | "availability"
  | "book"
  | "cancel"
  | "quote"
  | "human"
  | "confirm"
  | "deny"
  | "thanks"
  | "other";

type Rule = { intent: Intent; patterns: RegExp[] };

const RULES: Rule[] = [
  {
    intent: "human",
    patterns: [
      /parler.*(patron|responsable|humain|quelqu.?un)/i,
      /le patron/i,
      /(appel|appelez|téléph)/i,
      /transfert/i,
      /dama b[eë]gg.*(waa|patron|kaw)/i,
      /waa ju mag/i,
    ],
  },
  {
    intent: "cancel",
    patterns: [
      /annul/i,
      /je (ne )?viens pas/i,
      /j'?annule/i,
      /b[eë]gg naa bañ/i,
      /duma ñ[eë]w/i,
    ],
  },
  {
    intent: "book",
    patterns: [
      /rendez[-\s]?vous/i,
      /\brdv\b/i,
      /r[eé]server/i,
      /prendre.*(cr[eé]neau|place)/i,
      /je (veux|voudrais|peux) (venir|passer)/i,
      /dama b[eë]gg rendez/i,
      /j[eë]lal rendez/i,
    ],
  },
  {
    intent: "availability",
    patterns: [
      /disponible/i,
      /place/i,
      /cr[eé]neau/i,
      /vous [eê]tes l[aà]/i,
      /demain/i,
      /aujourd.?hui/i,
      /suba/i,
      /tey/i,
    ],
  },
  {
    intent: "hours",
    patterns: [
      /horaire/i,
      /ouvert/i,
      /ferm[eé]/i,
      /[aà] quelle heure/i,
      /waxtu/i,
      /yendu/i,
      /saa yu/i,
    ],
  },
  {
    intent: "location",
    patterns: [
      /o[uù] [eê]tes/i,
      /adresse/i,
      /situ[eé]/i,
      /localis/i,
      /comment (y )?venir/i,
      /fan ngeen/i,
      /fan nga/i,
      /ana/i,
    ],
  },
  {
    intent: "prices",
    patterns: [
      /tarif/i,
      /prix/i,
      /combien/i,
      /co[uû]te/i,
      /ñaata/i,
      /naata/i,
      /jar/i,
    ],
  },
  {
    intent: "quote",
    patterns: [
      /devis/i,
      /probl[eè]me/i,
      /r[eé]par/i,
      /panne/i,
      /d[eé]marr/i,
      /braids?/i,
      /tress/i,
      /je veux faire/i,
      /estimation/i,
    ],
  },
  {
    intent: "confirm",
    patterns: [/^(oui|ok|okay|d.?accord|vas-y|confirme|waaw|nchallah|incha)\b/i],
  },
  {
    intent: "deny",
    patterns: [/^(non|pas maintenant|annule|d[eé]ed[eé]et|deedeet|duma)\b/i],
  },
  {
    intent: "thanks",
    patterns: [/merci/i, /j[eë]r[eë]j[eë]f/i, /jerejef/i],
  },
  {
    intent: "greeting",
    patterns: [
      /^(salut|bonjour|bonsoir|hello|salam|salaam|asalaam|naka nga)/i,
    ],
  },
];

export function classifyIntent(text: string): { intent: Intent; confidence: number } {
  const t = text.trim();
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (p.test(t)) {
        const confidence = rule.intent === "availability" && /\b(demain|aujourd|lundi|mardi)\b/i.test(t) && /rendez|rdv|venir|r[eé]serv/i.test(t)
          ? 0.5
          : 0.9;
        return { intent: rule.intent, confidence };
      }
    }
  }
  if (/\d{1,2}\s*h/.test(t) || /\d{1,2}:\d{2}/.test(t)) {
    return { intent: "book", confidence: 0.7 };
  }
  return { intent: "other", confidence: 0.3 };
}
