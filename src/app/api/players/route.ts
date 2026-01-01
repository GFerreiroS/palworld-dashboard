import { NextResponse } from "next/server";
import { proxyPalworld } from "@/lib/routeProxy";
import {
  mergeOnlinePlayers,
  listPlayers,
  type PalworldPlayer,
} from "@/lib/playerStore";

export async function GET() {
  const res = await proxyPalworld("/v1/api/players", { method: "GET" });

  if (!res.ok) {
    // forward error
    return NextResponse.json(await res.json().catch(() => ({})), {
      status: res.status,
    });
  }

  const data = (await res.json()) as { players: PalworldPlayer[] };
  const players = Array.isArray(data?.players) ? data.players : [];

  mergeOnlinePlayers(players);

  return NextResponse.json(listPlayers());
}
