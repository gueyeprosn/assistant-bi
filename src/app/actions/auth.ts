"use server";

import { redirect } from "next/navigation";
import { clearSession, loginWithPhonePin, logoutEverywhere, registerOwner } from "@/lib/auth";
import { parseSignupForm } from "@/lib/signup";

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
  const parsed = parseSignupForm(formData);
  if (!parsed.ok) {
    redirect(`/inscription?error=${encodeURIComponent(parsed.error)}`);
  }
  const result = await registerOwner(parsed.data);
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
