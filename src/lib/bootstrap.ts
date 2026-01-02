import fs from "fs";
import { loadConfig, hasEnvBaseUrl } from "@/lib/config";

const CONFIG = "/config/config.yml";

export function needsSetup(): boolean {
  if (hasEnvBaseUrl()) return false;

  if (!fs.existsSync(CONFIG)) return true;

  try {
    const cfg = loadConfig();

    return cfg.server.base_url.includes("PALWORLD_SERVER_IP");
  } catch {
    return true;
  }
}
