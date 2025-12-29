import { NextResponse } from "next/server";
import { palworldFetch } from "@/lib/palworldClient";

export async function POST() {
  const res = await palworldFetch("/v1/api/stop", {
    method: "POST",
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Palworld returns empty body -> normalize
  return NextResponse.json({ ok: true });
}
