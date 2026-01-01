import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/session";

function getExternalOrigin(req: Request): string {
  const proto =
    req.headers.get("x-forwarded-proto") ??
    req.headers.get("forwarded")?.match(/proto=([^;]+)/)?.[1] ??
    "http";

  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost";

  // x-forwarded-host usually already includes the port if needed
  return `${proto}://${host}`;
}

function logoutResponse(req: Request) {
  const origin = getExternalOrigin(req);
  const url = new URL("/login", origin);

  const res = NextResponse.redirect(url);
  clearAuthCookie(res);
  return res;
}

export async function GET(req: Request) {
  return logoutResponse(req);
}

export async function POST(req: Request) {
  return logoutResponse(req);
}
