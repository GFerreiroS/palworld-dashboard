import { NextResponse } from "next/server";
import { z } from "zod";
import { loadConfig } from "@/lib/config";
import { setAuthCookie } from "@/lib/session";
import { log } from "@/lib/logger";

const Schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().trim().min(1),
});

type LoginAttempt = {
  ts: string;
  ip: string;
  username: string;
  ok: boolean;
  status: number;
  reason?: string;
};

// Keep recent attempts in memory (best-effort; resets on restart)
const MAX_ATTEMPTS = 200;
const attempts: LoginAttempt[] = [];

function pushAttempt(a: LoginAttempt) {
  attempts.push(a);
  if (attempts.length > MAX_ATTEMPTS) {
    attempts.splice(0, attempts.length - MAX_ATTEMPTS);
  }
}

function getClientIp(req: Request): string {
  // Common proxy headers first
  const xff = req.headers.get("x-forwarded-for");
  if (xff && xff.trim().length > 0) {
    // first IP in list is client
    return xff.split(",")[0]!.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  // Fallback: not always available depending on runtime/proxy
  const cf = req.headers.get("cf-connecting-ip");
  if (cf && cf.trim().length > 0) {
    return cf.trim();
  }

  return "unknown";
}

function logAttempt(a: LoginAttempt) {
  const base = `[LOGIN] ts=${a.ts} ip=${a.ip} user="${a.username}" ok=${a.ok} status=${a.status}`;
  if (a.reason) {
    log(`${base} reason="${a.reason}"`);
  } else {
    log(base);
  }
}

// Exported ONLY so we can show attempts in an endpoint later
export function _getLoginAttempts(): LoginAttempt[] {
  // return a copy newest-first
  return [...attempts].reverse();
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ts = new Date().toISOString();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    const a: LoginAttempt = {
      ts,
      ip,
      username: "?",
      ok: false,
      status: 400,
      reason: "invalid_json",
    };
    pushAttempt(a);
    logAttempt(a);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    const a: LoginAttempt = {
      ts,
      ip,
      username: "?",
      ok: false,
      status: 400,
      reason: "missing_fields",
    };
    pushAttempt(a);
    logAttempt(a);
    return NextResponse.json(
      { error: "username/password required" },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;

  const token = Buffer.from(`${username}:${password}`, "utf-8").toString(
    "base64",
  );
  const auth = `Basic ${token}`;

  const { server } = loadConfig();
  const base = server.base_url.replace(/\/+$/, "");

  let verify: Response;
  try {
    verify = await fetch(`${base}/v1/api/info`, {
      headers: { Accept: "application/json", Authorization: auth },
      cache: "no-store",
    });
  } catch {
    const a: LoginAttempt = {
      ts,
      ip,
      username,
      ok: false,
      status: 400,
      reason: "server_unreachable",
    };
    pushAttempt(a);
    logAttempt(a);
    return NextResponse.json(
      { error: "Server not reachable" },
      { status: 400 },
    );
  }

  if (verify.status === 401 || verify.status === 403) {
    const a: LoginAttempt = {
      ts,
      ip,
      username,
      ok: false,
      status: 401,
      reason: "unauthorized",
    };
    pushAttempt(a);
    logAttempt(a);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!verify.ok) {
    const a: LoginAttempt = {
      ts,
      ip,
      username,
      ok: false,
      status: verify.status,
      reason: "unexpected_status",
    };
    pushAttempt(a);
    logAttempt(a);
    return NextResponse.json(
      { error: `Unexpected status: ${verify.status}` },
      { status: 400 },
    );
  }

  const a: LoginAttempt = { ts, ip, username, ok: true, status: 200 };
  pushAttempt(a);
  logAttempt(a);

  const res = NextResponse.json({ ok: true });
  setAuthCookie(res, auth);
  return res;
}
