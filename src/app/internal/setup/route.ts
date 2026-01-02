import fs from "fs";
import yaml from "js-yaml";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEnvBaseUrl, loadConfig, ConfigSchema } from "@/lib/config";
import { palworldFetch } from "@/lib/palworldClient";

const CONFIG_PATH = "/config/config.yml";
const EXAMPLE_PATH = "/config/config.example.yml";

const SetupBodySchema = z.object({
  base_url: z.string().min(1),
  dashboard_name: z.string().min(1).max(80),
});

function readYaml(path: string): unknown {
  return yaml.load(fs.readFileSync(path, "utf-8"));
}

function writeYaml(path: string, data: unknown) {
  const out = yaml.dump(data, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(path, out, "utf-8");
}

function normalizeBaseUrl(v: string): string {
  const t = v.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `http://${t}`;
}

export async function GET() {
  // If env base URL is set, setup is not needed (and writing would be pointless)
  if (hasEnvBaseUrl()) {
    return new NextResponse(null, { status: 204 });
  }

  // If config is valid, setup is not needed
  try {
    loadConfig();
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function POST(req: Request) {
  // If env base URL is set, do not allow setup writes (env overrides anyway)
  if (hasEnvBaseUrl()) {
    return NextResponse.json(
      {
        error:
          "Setup is disabled because PALWORLD_BASE_URL is set in the container environment.",
      },
      { status: 400 },
    );
  }

  let body: z.infer<typeof SetupBodySchema>;
  try {
    body = SetupBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const baseUrl = normalizeBaseUrl(body.base_url);
  const dashboardName = body.dashboard_name.trim();

  // Build a config object based on example (if exists) or current config
  let raw: unknown;
  if (fs.existsSync(CONFIG_PATH)) raw = readYaml(CONFIG_PATH);
  else raw = readYaml(EXAMPLE_PATH);

  // Ensure it is object-shaped and apply updates
  const root =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const dashboard =
    typeof root.dashboard === "object" &&
    root.dashboard !== null &&
    !Array.isArray(root.dashboard)
      ? ({ ...(root.dashboard as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : ({} as Record<string, unknown>);

  const server =
    typeof root.server === "object" &&
    root.server !== null &&
    !Array.isArray(root.server)
      ? ({ ...(root.server as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : ({} as Record<string, unknown>);

  dashboard.name = dashboardName;
  // keep existing refresh_seconds from example/config (don’t ask user for it here)
  server.base_url = baseUrl;

  root.dashboard = dashboard;
  root.server = server;

  // Validate before writing
  let validated: unknown;
  try {
    validated = ConfigSchema.parse(root);
  } catch {
    return NextResponse.json(
      { error: "Config validation failed. Check dashboard name and base URL." },
      { status: 400 },
    );
  }

  // Test connectivity to Palworld server (info endpoint). We don't have credentials yet, so:
  // - 200: great
  // - 401: also acceptable (server reachable, auth required)
  try {
    const res = await palworldFetch(`${baseUrl}/v1/api/info`, undefined);
    if (!(res.status === 200 || res.status === 401)) {
      return NextResponse.json(
        { error: `Server responded with HTTP ${res.status}. Check base URL.` },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not reach the server. Check base URL and network." },
      { status: 400 },
    );
  }

  // Write config.yml
  try {
    writeYaml(CONFIG_PATH, validated);
  } catch {
    return NextResponse.json(
      { error: "Failed to write config.yml (is /config writable?)" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
