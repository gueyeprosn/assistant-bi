"use server";

import { redirect } from "next/navigation";
import { clearSession, loginWithPhonePin, logoutEverywhere, registerOwner } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const phone = String(formData.get("phone") || "");
  const pin = String(formData.get("pin") || "");
  const result = await loginWithPhonePin(phone, pin);
  if ("error" in result && result.error) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }
  const user = "user" in result ? result.user : null;
  if (user?.role === "admin") redirect("/admin");
  redirect("/app");
}

export async function signupAction(formData: FormData) {
  const result = await registerOwner({
    phoneRaw: String(formData.get("phone") || ""),
    pin: String(formData.get("pin") || ""),
    pinConfirm: String(formData.get("pinConfirm") || ""),
    businessName: String(formData.get("businessName") || ""),
    ownerName: String(formData.get("ownerName") || ""),
    category: String(formData.get("category") || ""),
    neighborhood: String(formData.get("neighborhood") || ""),
  });
  if ("error" in result && result.error) {
    redirect(`/inscription?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function logoutEverywhereAction() {
  await logoutEverywhere();
  redirect("/login");
}
