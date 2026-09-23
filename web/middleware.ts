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

function getSetCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const cookies: string[] = [];
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") cookies.push(value);
  });
  return cookies;
}

function normalizeRedirectLocation(location: string, request: NextRequest): string {
  const host = request.headers.get("host");
  if (!host) return location;
  for (const prefix of [`https://${host}`, `http://${host}`]) {
    if (location.startsWith(prefix)) {
      const path = location.slice(prefix.length);
      return path.startsWith("/") ? path : `/${path}`;
    }
  }
  return location;
}

function appendUpstreamCookies(response: NextResponse, upstream: Response) {
  for (const cookie of getSetCookies(upstream.headers)) {
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
      const normalized = normalizeRedirectLocation(location, request);
      const response = new NextResponse(null, {
        status: upstream.status,
        headers: { Location: normalized },
      });
      return appendUpstreamCookies(response, upstream);
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
    pathname.startsWith("/finale") ||
    pathname.startsWith("/dashboard");

  if (isProtected && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isLoggedIn && isAuthPage) {
    // Invite / group register links must not bounce an existing session
    // (e.g. admin) into /intro → Start Mission. Clear the session first.
    if (pathname === "/register") {
      const invite = req.nextUrl.searchParams.get("invite");
      const group = req.nextUrl.searchParams.get("group");
      if (invite || group) {
        const clear = new URL("/register/clear", req.nextUrl);
        clear.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
        return NextResponse.redirect(clear);
      }
    }
    return NextResponse.redirect(new URL("/intro", req.nextUrl));
  }

  // Invite-only registration: bare /register without token goes to login.
  if (pathname === "/register") {
    const invite = req.nextUrl.searchParams.get("invite");
    const group = req.nextUrl.searchParams.get("group");
    if (!invite && !group) {
      const login = new URL("/login", req.nextUrl);
      login.searchParams.set("needInvite", "1");
      return NextResponse.redirect(login);
    }
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

  // Never run auth on /_next — WebSocket HMR upgrades fail through NextAuth middleware
  // (ERR_INVALID_HTTP_RESPONSE / 502), which can leave SSR HTML without client handlers.
  if (request.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  return authMiddleware(request, {} as never);
}

export const config = {
  // When HOMELAB_TUNNEL_URL is set, proxy app routes AND /_next/* so HTML/JS stay in sync.
  // Locally, the handler above short-circuits /_next before auth (HMR websockets).
  // Only favicon + /media stay on Vercel; bare "/" is excluded (.+ requires a path segment).
  matcher: ["/((?!favicon.ico|media/).+)"],
};
