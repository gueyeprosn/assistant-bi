export type Lang = "fr" | "wo";

const WOLOF_MARKERS = [
  "naka",
  "waaw",
  "deedeet",
  "déedéet",
  "degg",
  "dégg",
  "fan nga",
  "fan ngeen",
  "ñaata",
  "naata",
  "bëgg",
  "begg",
  "jamm",
  "ndax",
  "suba",
  "tey",
  "ginaaw",
  "waxtu",
  "jërëjëf",
  "jerejef",
  "asalaam",
  "salaam",
  "ngeen",
  "danga",
  "dama",
  "damay",
  "def",
  "nanga def",
  "nekk",
  "liggeey",
  "yendu",
  "bes bi",
  "bés",
  "walla",
  "man naa",
  "mën naa",
  "kay",
  "baax",
  "sa waxtu",
  "sant yallah",
  "duma",
];

const FRENCH_MARKERS = [
  "bonjour",
  "bonsoir",
  "s'il vous",
  "est-ce",
  "horaire",
  "rendez-vous",
  "merci",
  "combien",
  "adresse",
  "tarif",
  "prix",
  "disponible",
];

export function detectLanguage(text: string): Lang {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  let wolofScore = 0;
  for (const w of WOLOF_MARKERS) {
    const n = w.normalize("NFD").replace(/\p{M}/gu, "");
    if (t.includes(n)) wolofScore += 1;
  }

  let frenchScore = 0;
  for (const f of FRENCH_MARKERS) {
    const n = f.normalize("NFD").replace(/\p{M}/gu, "");
    if (t.includes(n)) frenchScore += 1;
  }

  if (wolofScore >= 1 && frenchScore === 0) return "wo";
  if (wolofScore > frenchScore) return "wo";
  return "fr";
}

export function resolveBotLang(text: string, defaultLang: string): Lang {
  const detected = detectLanguage(text);
  if (defaultLang === "both") return detected;
  if (defaultLang === "wo") {
    const t = text.toLowerCase();
    const french = FRENCH_MARKERS.filter((w) => t.includes(w)).length;
    return french >= 2 ? "fr" : "wo";
  }
  return detected;
}
