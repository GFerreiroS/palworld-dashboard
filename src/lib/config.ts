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
    username: z.string(),
    password: z.string(),
  }),
  map: z
    .object({
      image_path: z.string(),
      image: z.object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      }),
      world: z.object({
        min_x: z.number(),
        max_x: z.number(),
        min_y: z.number(),
        max_y: z.number(),
      }),
    })
    .optional(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(): AppConfig {
  const raw = fs.readFileSync("/config/config.yml", "utf-8");
  const parsed = yaml.load(raw);
  return ConfigSchema.parse(parsed);
}
