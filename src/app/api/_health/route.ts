import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";

export async function GET() {
  const { server } = loadConfig();
  const base = server.base_url.replace(/\/+$/, "");

  try {
    const res = await fetch(`${base}/v1/api/info`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    // "Up" even if it requires auth
    const up = [200, 401, 403].includes(res.status);

    return NextResponse.json({
      ok: up,
      status: res.status,
      base_url: server.base_url,
    });
  } catch {
    return NextResponse.json(
      { ok: false, status: 0, base_url: server.base_url, error: "unreachable" },
      { status: 200 },
    );
  }
}
