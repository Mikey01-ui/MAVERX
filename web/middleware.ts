import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
]);

function homelabTunnel(): string | null {
  const raw = process.env.HOMELAB_TUNNEL_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

async function proxyToHomelab(request: NextRequest, tunnel: string) {
  const path = request.nextUrl.pathname || "/";
  const search = request.nextUrl.search || "";
  const target = `${tunnel}${path}${search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const outHeaders = new Headers();

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "set-cookie") return;
    outHeaders.append(key, value);
  });

  // Redirect responses must not include a body (breaks Vercel edge middleware).
  if (upstream.status >= 300 && upstream.status < 400) {
    return new NextResponse(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

const authMiddleware = NextAuth(authConfig).auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtected =
    pathname.startsWith("/hub") ||
    pathname.startsWith("/mission") ||
    pathname.startsWith("/intro") ||
    pathname.startsWith("/finale");

  if (isProtected && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/intro", req.nextUrl));
  }

  return NextResponse.next();
});

export default async function middleware(request: NextRequest) {
  const tunnel = homelabTunnel();
  if (tunnel) {
    try {
      return await proxyToHomelab(request, tunnel);
    } catch (error) {
      console.error("homelab proxy error", error);
      return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
    }
  }
  return authMiddleware(request, {} as never);
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|media/).*)"],
};
