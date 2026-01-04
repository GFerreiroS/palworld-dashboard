import fs from "fs";
import yaml from "js-yaml";
import { z } from "zod";

export const ConfigSchema = z.object({
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
const EXAMPLE_PATH = "/app/config/config.example.yml";

function readYamlFile(path: string): unknown {
  const raw = fs.readFileSync(path, "utf-8");
  return yaml.load(raw);
}

function writeYamlFile(path: string, data: unknown) {
  const out = yaml.dump(data, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(path, out, "utf-8");
}

function envString(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function envPositiveInt(name: string): number | undefined {
  const v = envString(name);
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i > 0 ? i : undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeBaseUrl(v: string): string {
  const trimmed = v.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

function applyEnvOverrides(raw: unknown): unknown {
  const root: Record<string, unknown> = isRecord(raw) ? { ...raw } : {};

  const dashboard: Record<string, unknown> = isRecord(root.dashboard)
    ? { ...root.dashboard }
    : {};
  const server: Record<string, unknown> = isRecord(root.server)
    ? { ...root.server }
    : {};

  const name = envString("DASHBOARD_NAME");
  if (name) dashboard.name = name;

  const refresh = envPositiveInt("DASHBOARD_REFRESH_SECONDS");
  if (refresh !== undefined) dashboard.refresh_seconds = refresh;

  const envBase = envString("PALWORLD_BASE_URL");
  if (envBase) {
    server.base_url = normalizeBaseUrl(envBase);
  } else if (typeof server.base_url === "string") {
    server.base_url = normalizeBaseUrl(server.base_url);
  }

  root.dashboard = dashboard;
  root.server = server;

  return root;
}

export function ensureConfigFileExists(): void {
  if (fs.existsSync(CONFIG_PATH)) return;

  try {
    const example = readYamlFile(EXAMPLE_PATH);
    const merged = applyEnvOverrides(example);

    const validated = ConfigSchema.parse(merged);

    writeYamlFile(CONFIG_PATH, validated);
  } catch {
    // Ignore: container may be read-only or example missing
  }
}

export function loadConfig(): AppConfig {
  ensureConfigFileExists();

  let raw: unknown;
  if (fs.existsSync(CONFIG_PATH)) {
    raw = readYamlFile(CONFIG_PATH);
  } else {
    raw = readYamlFile(EXAMPLE_PATH);
  }

  const merged = applyEnvOverrides(raw);
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

export function hasEnvBaseUrl(): boolean {
  return envString("PALWORLD_BASE_URL") !== undefined;
}
