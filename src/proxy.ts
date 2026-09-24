import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { resolveActiveSession } from "@/lib/auth/active-session";

const SESSION_COOKIE = "sl_session";
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/settings", "/admin"];
const AUTH_PAGES = ["/login", "/signup"];

function getSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** JWT plus a live, unrevoked auth_sessions row. Fails closed if the lookup throws. */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
  } catch {
    return false;
  }
  try {
    const active = await resolveActiveSession(token);
    return active !== null;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );
  const authenticated = await hasValidSession(request);

  if (
    (pathname === "/dashboard/campus-circle" ||
      pathname.startsWith("/dashboard/campus-circle/")) &&
    process.env.FEATURE_CAMPUS_CIRCLE !== "true"
  ) {
    const res = NextResponse.redirect(new URL("/dashboard", request.url));
    res.headers.set("x-request-id", requestId);
    return res;
  }

  if (isProtected && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const res = NextResponse.redirect(loginUrl);
    if (request.cookies.get(SESSION_COOKIE)?.value) clearSessionCookie(res);
    res.headers.set("x-request-id", requestId);
    return res;
  }

  if (isAuthPage && authenticated) {
    const dest = new URL("/dashboard", request.url);
    dest.searchParams.set("notice", "already-signed-in");
    const res = NextResponse.redirect(dest);
    res.headers.set("x-request-id", requestId);
    return res;
  }

  const res = NextResponse.next();
  if (isAuthPage && request.cookies.get(SESSION_COOKIE)?.value) {
    clearSessionCookie(res);
  }
  res.headers.set("x-request-id", requestId);
  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
