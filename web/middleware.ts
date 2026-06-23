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
  if (!raw?.startsWith("http")) return null;
  return raw.replace(/\/$/, "");
}

function appendUpstreamCookies(response: NextResponse, upstream: Response) {
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

async function proxyToHomelab(request: NextRequest, tunnel: string) {
  const path = request.nextUrl.pathname || "/";
  const search = request.nextUrl.search || "";
  const target = `${tunnel}${path}${search}`;

  const headers = new Headers(request.headers);
  const host = request.headers.get("host");
  headers.delete("host");
  if (host) {
    headers.set("x-forwarded-host", host);
    headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  }

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

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    if (location) {
      return appendUpstreamCookies(NextResponse.redirect(location, upstream.status), upstream);
    }
  }

  return appendUpstreamCookies(
    new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    }),
    upstream,
  );
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
  // `.+` excludes bare "/" (Vercel edge crashes proxying root); homepage client-redirects.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|media/).+)"],
};
