import { NextResponse } from "next/server";
import { proxyPalworld } from "@/lib/routeProxy";
import {
  getPlayersView,
  setLiveOnlineSnapshot,
  maybeFlushPlayersDb,
  type PalworldPlayer,
} from "@/lib/playerStore";

function isSnapshotStale(
  liveOnlineAt: string | null,
  maxAgeMs: number,
): boolean {
  if (!liveOnlineAt) return true;
  const t = Date.parse(liveOnlineAt);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > maxAgeMs;
}

export async function GET() {
  const viewBefore = getPlayersView();

  const STALE_AFTER_MS = 15_000; // 15s: if snapshot older than this, refresh
  if (isSnapshotStale(viewBefore.liveOnlineAt ?? null, STALE_AFTER_MS)) {
    const res = await proxyPalworld("/v1/api/players", { method: "GET" });

    if (res.ok) {
      const json = (await res.json()) as { players?: PalworldPlayer[] };
      const players = Array.isArray(json.players) ? json.players : [];
      setLiveOnlineSnapshot(players, new Date().toISOString());
    } else if (res.status === 401) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
  }

  maybeFlushPlayersDb(false);

  return NextResponse.json(getPlayersView());
}
