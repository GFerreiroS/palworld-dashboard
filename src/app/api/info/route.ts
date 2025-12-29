import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { basicAuthHeader } from "@/lib/palworldAuth";

export async function GET() {
  const { server } = loadConfig();

  const res = await fetch(`${server.base_url}/v1/api/info`, {
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(server.username, server.password),
    },
    cache: "no-store",
  });

  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
