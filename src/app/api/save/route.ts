import { NextResponse } from "next/server";
import { palworldFetch } from "@/lib/palworldClient";

export async function POST() {
  const res = await palworldFetch("/v1/api/save", {
    method: "POST",
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.json({ ok: true });
}
