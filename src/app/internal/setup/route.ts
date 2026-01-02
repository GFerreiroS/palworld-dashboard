import fs from "fs";
import yaml from "js-yaml";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ConfigSchema } from "@/lib/config";
import { hasEnvBaseUrl, hasUsableConfig } from "@/lib/config";

const SetupSchema = z.object({
  base_url: z.string().trim().min(1),
});

export async function POST(req: Request) {
  let json: unknown;

  if (hasEnvBaseUrl()) {
    return new NextResponse(null, { status: 204 });
  }

  if (hasUsableConfig()) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = SetupSchema.safeParse(json);
  if (!input.success) {
    return NextResponse.json(
      { error: "base_url is required" },
      { status: 400 },
    );
  }

  const baseUrl = input.data.base_url.replace(/\/+$/, "");

  // Verify server is reachable (allow Unauthorized/Forbidden)
  try {
    const res = await fetch(`${baseUrl}/v1/api/info`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (![200, 401, 403].includes(res.status)) {
      return NextResponse.json(
        { error: `Unexpected response from server: ${res.status}` },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Server not reachable" },
      { status: 400 },
    );
  }

  // Load and validate example config (no `any`)
  let exampleUnknown: unknown;
  try {
    const exampleRaw = fs.readFileSync("/config/config.example.yml", "utf-8");
    exampleUnknown = yaml.load(exampleRaw);
  } catch {
    return NextResponse.json(
      { error: "Missing or unreadable /config/config.example.yml" },
      { status: 500 },
    );
  }

  const parsedExample = ConfigSchema.safeParse(exampleUnknown);
  if (!parsedExample.success) {
    return NextResponse.json(
      { error: "config.example.yml is invalid (does not match schema)" },
      { status: 500 },
    );
  }

  // Create final config from validated template
  const finalConfig = {
    ...parsedExample.data,
    server: {
      ...parsedExample.data.server,
      base_url: baseUrl,
    },
  };

  try {
    fs.writeFileSync("/config/config.yml", yaml.dump(finalConfig), "utf-8");
  } catch {
    return NextResponse.json(
      { error: "Failed to write /config/config.yml" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
