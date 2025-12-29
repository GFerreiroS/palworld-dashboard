import { NextResponse } from "next/server";
import { palworldFetch } from "@/lib/palworldClient";

export async function GET() {
  const res = await palworldFetch("/v1/api/info");
  return NextResponse.json({ ok: res.ok, status: res.status });
}
