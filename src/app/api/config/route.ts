import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { AUTH_COOKIE } from "@/lib/session";

const CONFIG_PATH = "/config/config.yml";

const ConfigSchema = z.object({
  dashboard: z.object({
    name: z.string().min(1),
    refresh_seconds: z.number().int().min(1).max(60),
  }),
  server: z.object({
    base_url: z.string().min(1),
  }),
});

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error("config.yml not found");
  }
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const parsed = yaml.load(raw);
  return ConfigSchema.parse(parsed);
}

function writeConfig(cfg: z.infer<typeof ConfigSchema>) {
  // atomic write
  const dir = path.dirname(CONFIG_PATH);
  const tmp = path.join(dir, `.config.yml.tmp-${Date.now()}`);
  const out = yaml.dump(cfg, { lineWidth: 120 });

  fs.writeFileSync(tmp, out, "utf-8");
  fs.renameSync(tmp, CONFIG_PATH);
}

function requireAuth() {
  const jar = cookies();
  const auth = jar.get(AUTH_COOKIE)?.value;
  return !!auth;
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const cfg = readConfig();
    return NextResponse.json(cfg);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid config payload" },
      { status: 400 },
    );
  }

  try {
    writeConfig(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to write config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
