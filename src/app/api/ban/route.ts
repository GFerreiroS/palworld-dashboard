import { z } from "zod";
import { proxyPalworld } from "@/lib/routeProxy";
import { NextResponse } from "next/server";

const Schema = z.object({
  userid: z.string().trim().min(1, "`userid` is required"),
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

  return proxyPalworld("/v1/api/ban", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}
