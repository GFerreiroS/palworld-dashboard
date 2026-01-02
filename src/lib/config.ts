import fs from "fs";
import yaml from "js-yaml";
import { z } from "zod";

const ConfigSchema = z.object({
  dashboard: z.object({
    name: z.string(),
    refresh_seconds: z.number().int().positive(),
  }),
  server: z.object({
    base_url: z.string().url(),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

const CONFIG_PATH = "/config/config.yml";
const EXAMPLE_PATH = "/config/config.example.yml";

function loadYaml(path: string): unknown {
  return yaml.load(fs.readFileSync(path, "utf-8"));
}

function withEnvOverrides(raw: any): any {
  const out = structuredClone(raw ?? {});

  out.dashboard ??= {};
  out.server ??= {};

  if (process.env.DASHBOARD_NAME) {
    out.dashboard.name = process.env.DASHBOARD_NAME;
  }

  if (process.env.DASHBOARD_REFRESH_SECONDS) {
    const v = Number(process.env.DASHBOARD_REFRESH_SECONDS);
    if (!Number.isNaN(v) && v > 0) {
      out.dashboard.refresh_seconds = v;
    }
  }

  if (process.env.PALWORLD_BASE_URL) {
    out.server.base_url = process.env.PALWORLD_BASE_URL;
  }

  return out;
}

export function loadConfig(): AppConfig {
  let raw: unknown;

  if (fs.existsSync(CONFIG_PATH)) {
    raw = loadYaml(CONFIG_PATH);
  } else {
    raw = loadYaml(EXAMPLE_PATH);
  }

  const merged = withEnvOverrides(raw);
  return ConfigSchema.parse(merged);
}

export function hasUsableConfig(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}
