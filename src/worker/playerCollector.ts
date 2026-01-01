import { loadConfig } from "@/lib/config";
import {
  setLiveOnlineSnapshot,
  maybeFlushPlayersDb,
  type PalworldPlayer,
} from "@/lib/playerStore";
import { log } from "@/lib/logger";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getAuthHeader(): string | null {
  // Recommended: pass already formatted "Basic xxxx"
  const env = process.env.PALWORLD_BASIC_AUTH;
  if (env && env.trim().length > 0) return env.trim();

  return null;
}

async function fetchPlayers(
  baseUrl: string,
  auth: string,
): Promise<PalworldPlayer[]> {
  const base = baseUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}/v1/api/players`, {
    headers: {
      Accept: "application/json",
      Authorization: auth,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`palworld /players HTTP ${res.status}`);
  }

  const json = (await res.json()) as { players?: PalworldPlayer[] };
  return Array.isArray(json.players) ? json.players : [];
}

export async function runCollector() {
  const auth = getAuthHeader();
  if (!auth) {
    log(`[collector] disabled: missing PALWORLD_BASIC_AUTH`);
    return;
  }

  const cfg = loadConfig();
  const intervalSec = Math.max(1, cfg.dashboard.refresh_seconds ?? 2);
  const intervalMs = intervalSec * 1000;

  log(
    `[collector] started: interval=${intervalSec}s base_url=${cfg.server.base_url}`,
  );

  for (;;) {
    const nowIso = new Date().toISOString();
    try {
      const players = await fetchPlayers(cfg.server.base_url, auth);
      setLiveOnlineSnapshot(players, nowIso);

      // flush only sometimes (debounced)
      maybeFlushPlayersDb(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unknown error";
      log(`[collector] error: ${msg}`);
    }

    await sleep(intervalMs);
  }
}
