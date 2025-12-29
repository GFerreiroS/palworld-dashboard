import { z } from "zod";
import { proxyPalworld } from "@/lib/routeProxy";
import { NextResponse } from "next/server";

const Schema = z.object({
  waittime: z.number().int().nonnegative("`waittime` must be an integer >= 0"),
  message: z.string().trim().min(1).optional(),
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
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  return proxyPalworld("/v1/api/shutdown", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}
