"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLangAction(formData: FormData): Promise<void> {
  const lang = String(formData.get("lang") || "fr") === "wo" ? "wo" : "fr";
  const store = await cookies();
  store.set("ab_lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
