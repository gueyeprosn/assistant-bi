"use server";

import { redirect } from "next/navigation";
import { clearSession, loginWithPhonePin, logoutEverywhere, registerOwner } from "@/lib/auth";
import { loginHref, safeAppPath } from "@/lib/login-url";
import { parseSignupForm } from "@/lib/signup";

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).includes("NEXT_REDIRECT")
  );
}

function loginFields(formData: FormData) {
  const next = safeAppPath(String(formData.get("next") || ""));
  const vue = String(formData.get("vue") || "") === "admin" ? "admin" : "";
  return { next, vue };
}

export async function loginAction(formData: FormData) {
  const { next, vue } = loginFields(formData);
  try {
    const phone = String(formData.get("phone") || "");
    const pin = String(formData.get("pin") || "");
    const result = await loginWithPhonePin(phone, pin);
    if ("error" in result && result.error) {
      redirect(loginHref({ error: result.error, next, vue }));
    }
    const user = "user" in result ? result.user : null;
    if (user?.role === "admin") {
      redirect(next?.startsWith("/admin") ? next : "/admin");
    }
    redirect(next?.startsWith("/app") ? next : "/app");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("[login]", error);
    redirect(loginHref({ error: "Connexion impossible. Réessayez.", next, vue }));
  }
}

export async function signupAction(formData: FormData) {
  try {
    const parsed = parseSignupForm(formData);
    if (!parsed.ok) {
      redirect(`/inscription?error=${encodeURIComponent(parsed.error)}`);
    }
    const result = await registerOwner(parsed.data);
    if ("error" in result && result.error) {
      redirect(`/inscription?error=${encodeURIComponent(result.error)}`);
    }
    redirect("/app");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("[signup]", error);
    redirect(`/inscription?error=${encodeURIComponent("Inscription impossible. Réessayez.")}`);
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function logoutEverywhereAction() {
  await logoutEverywhere();
  redirect("/login");
}
