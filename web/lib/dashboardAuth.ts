import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/roles";

/** Allow Vite dashboard (and configured origins) to call admin APIs. */
export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (process.env.DASHBOARD_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = allowed.includes(origin) || allowed.includes("*");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Dashboard-Key",
    Vary: "Origin",
  };
  if (ok && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function jsonWithCors(request: Request, body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: corsHeaders(request),
  });
}

export function optionsCors(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/**
 * Dashboard admin auth: session admin OR shared DASHBOARD_API_KEY header.
 * Key lets the Vite app call APIs before SSO exists.
 */
export async function requireDashboardAdmin(request: Request): Promise<
  { ok: true; userId: string | null } | { ok: false; response: NextResponse }
> {
  const key = process.env.DASHBOARD_API_KEY?.trim();
  const headerKey = request.headers.get("x-dashboard-key")?.trim();
  if (key && headerKey && headerKey === key) {
    return { ok: true, userId: null };
  }

  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (isAdminRole(user?.role)) {
      return { ok: true, userId: session.user.id };
    }
  }

  return {
    ok: false,
    response: jsonWithCors(request, { error: "Unauthorized — admin session or X-Dashboard-Key required." }, { status: 401 }),
  };
}
