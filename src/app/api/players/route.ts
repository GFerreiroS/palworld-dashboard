import { NextResponse } from "next/server";
import { getPlayersView, maybeFlushPlayersDb } from "@/lib/playerStore";

export async function GET() {
  maybeFlushPlayersDb(false);

  return NextResponse.json(getPlayersView());
}
