import fs from "fs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/session";

const LOG_FILE = "/app/logs/app.log";

export async function GET() {
  const jar = await cookies();
  if (!jar.get(AUTH_COOKIE)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (!fs.existsSync(LOG_FILE)) {
    return NextResponse.json({ lines: [] });
  }

  const content = fs.readFileSync(LOG_FILE, "utf-8");
  const lines = content.trim().split("\n").slice(-500);

  return NextResponse.json({ lines });
}
