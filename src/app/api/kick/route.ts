import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyPalworld } from "@/lib/routeProxy";

const Schema = z.object({
  userid: z.string().min(1),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const res = await proxyPalworld("/v1/api/kick", {
    method: "POST",
    body: JSON.stringify(parsed.data),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return NextResponse.json(await res.json().catch(() => ({})), {
      status: res.status,
    });
  }

  return NextResponse.json({ ok: true });
}
