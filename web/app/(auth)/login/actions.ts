"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

/** Progressive-enhancement login — works when the React client never hydrates. */
export async function completeLogin(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/intro");
  const safeCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/intro";

  if (!email || password.length < 8) {
    redirect(`/login?error=credentials&callbackUrl=${encodeURIComponent(safeCallback)}`);
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallback,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=credentials&callbackUrl=${encodeURIComponent(safeCallback)}`);
    }
    // Successful Auth.js sign-in throws a redirect — rethrow it.
    throw err;
  }
}
