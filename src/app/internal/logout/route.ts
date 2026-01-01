import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/session";

function logoutResponse(reqUrl: string) {
  const url = new URL(reqUrl);
  url.pathname = "/login";
  url.search = "";
  url.hash = "";

  const res = NextResponse.redirect(url);
  clearAuthCookie(res);
  return res;
}

export async function GET(req: Request) {
  return logoutResponse(req.url);
}

export async function POST(req: Request) {
  return logoutResponse(req.url);
}
