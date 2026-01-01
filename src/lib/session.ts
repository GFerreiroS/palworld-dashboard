import type { NextResponse } from "next/server";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const AUTH_COOKIE = "pw_auth";
export const AUTH_MAX_AGE_SECONDS = 30 * 60; // 30 min idle timeout

export function getAuthFromCookies(jar: ReadonlyRequestCookies): string | null {
  return jar.get(AUTH_COOKIE)?.value ?? null;
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(res: NextResponse) {
  // Ensure delete matches the same path used when setting
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  // Also call delete (belt + suspenders)
  res.cookies.delete({
    name: AUTH_COOKIE,
    path: "/",
  });
}
