import fs from "fs";
import yaml from "js-yaml";
import { ConfigSchema } from "@/lib/config";

const CONFIG = "/config/config.yml";

export function needsSetup(): boolean {
  if (!fs.existsSync(CONFIG)) return true;

  try {
    const raw = fs.readFileSync(CONFIG, "utf-8");
    const parsed = yaml.load(raw);
    const cfg = ConfigSchema.parse(parsed);

    return cfg.server.base_url.includes("PALWORLD_SERVER_IP");
  } catch {
    return true;
  }
}
