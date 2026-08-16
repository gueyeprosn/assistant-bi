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
  "def",
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
];

export function detectLanguage(text: string): Lang {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  let score = 0;
  for (const w of WOLOF_MARKERS) {
    const n = w.normalize("NFD").replace(/\p{M}/gu, "");
    if (t.includes(n)) score += 1;
  }
  return score >= 2 ? "wo" : "fr";
}
