import { NextResponse } from "next/server";
import { z } from "zod";
import { palworldFetch } from "@/lib/palworldClient";

const ShutdownSchema = z.object({
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

  const parsed = ShutdownSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const res = await palworldFetch("/v1/api/shutdown", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  // Palworld may respond with empty body; normalize success
  if (res.ok) {
    const text = await res.text();
    if (text && text.trim().length > 0) {
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.json({ ok: true });
  }

  const errText = await res.text();
  return new NextResponse(errText || null, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
