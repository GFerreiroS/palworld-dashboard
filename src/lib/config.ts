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

export function loadConfig(): AppConfig {
  const raw = fs.readFileSync("/config/config.yml", "utf-8");
  const parsed = yaml.load(raw);
  return ConfigSchema.parse(parsed);
}
