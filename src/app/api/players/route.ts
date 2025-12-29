import { NextResponse } from "next/server";
import { palworldFetch } from "@/lib/palworldClient";

export async function GET() {
  const res = await palworldFetch("/v1/api/players");

  // Pass-through status + body (keeps 401/400/etc)
  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
