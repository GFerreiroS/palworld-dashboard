import { NextResponse } from "next/server";
import { z } from "zod";
import { palworldFetch } from "@/lib/palworldClient";

const BanSchema = z.object({
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

  const parsed = BanSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const res = await palworldFetch("/v1/api/ban", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
