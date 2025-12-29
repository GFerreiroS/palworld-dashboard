import { NextResponse } from "next/server";
import { z } from "zod";
import { loadConfig } from "@/lib/config";
import { setAuthCookie } from "@/lib/session";

const Schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().trim().min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "username/password required" },
      { status: 400 },
    );
  }

  const { server } = loadConfig();

  const token = Buffer.from(
    `${parsed.data.username}:${parsed.data.password}`,
    "utf-8",
  ).toString("base64");
  const auth = `Basic ${token}`;

  // verify credentials
  let verify: Response;
  try {
    verify = await fetch(`${server.base_url.replace(/\/+$/, "")}/v1/api/info`, {
      headers: { Accept: "application/json", Authorization: auth },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Server not reachable" },
      { status: 400 },
    );
  }

  if (verify.status === 401 || verify.status === 403) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!verify.ok) {
    return NextResponse.json(
      { error: `Unexpected status: ${verify.status}` },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookie(res, auth);
  return res;
}
