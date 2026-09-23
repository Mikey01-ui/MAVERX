import { signOut } from "@/lib/auth";
import { NextRequest } from "next/server";

/**
 * Clears an existing session then sends the browser to an invite register URL.
 * Used when a logged-in user (e.g. admin) opens an invite link.
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/register";
  const safe =
    next.startsWith("/register?") || next === "/register"
      ? next
      : "/login?needInvite=1";

  await signOut({ redirectTo: safe });
}
