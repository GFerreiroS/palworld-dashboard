import fs from "fs";
import yaml from "js-yaml";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { base_url } = await req.json();

  if (!base_url || typeof base_url !== "string") {
    return NextResponse.json({ error: "Invalid base_url" }, { status: 400 });
  }

  try {
    const res = await fetch(`${base_url.replace(/\/+$/, "")}/v1/api/info`);
    if (![200, 401, 403].includes(res.status)) {
      return NextResponse.json(
        { error: "Server responded unexpectedly" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Server not reachable" },
      { status: 400 },
    );
  }

  const example = yaml.load(
    fs.readFileSync("/config/config.example.yml", "utf-8"),
  ) as any;

  example.server.base_url = base_url;

  fs.writeFileSync("/config/config.yml", yaml.dump(example));

  return NextResponse.json({ ok: true });
}
