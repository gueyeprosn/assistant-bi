import { cookies } from "next/headers";

export async function getLang(): Promise<"fr" | "wo"> {
  const store = await cookies();
  return store.get("ab_lang")?.value === "wo" ? "wo" : "fr";
}
