import fs from "fs";
import path from "path";

const PLAYERS_PATH = "/config/players.json";
const BANNED_PATH = "/config/banned.json";

export type PlayerRecord = {
  userId: string;

  // last known identity
  name?: string;
  accountName?: string;

  // last known details
  playerId?: string;
  ip?: string;
  ping?: number;
  location_x?: number;
  location_y?: number;
  level?: number;
  building_count?: number;

  // history timestamps
  firstSeen: string; // ISO
  lastSeen: string; // ISO

  // derived
  online: boolean;
};

export type PalworldPlayer = {
  name: string;
  accountName: string;
  playerId: string;
  userId: string;
  ip: string;
  ping: number;
  location_x: number;
  location_y: number;
  level: number;
  building_count: number;
};

type PlayerDb = Record<string, PlayerRecord>;
type BannedDb = Record<
  string,
  { userId: string; bannedAt: string; reason?: string }
>;

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf-8").trim();
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function atomicWrite(file: string, content: string) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const tmp = path.join(dir, `.tmp-${path.basename(file)}-${Date.now()}`);
  fs.writeFileSync(tmp, content, "utf-8");
  fs.renameSync(tmp, file);
}

function writeJson<T>(file: string, data: T) {
  atomicWrite(file, JSON.stringify(data, null, 2));
}

export function readPlayersDb(): PlayerDb {
  return readJson<PlayerDb>(PLAYERS_PATH, {});
}

export function writePlayersDb(db: PlayerDb) {
  writeJson(PLAYERS_PATH, db);
}

export function readBannedDb(): BannedDb {
  return readJson<BannedDb>(BANNED_PATH, {});
}

export function writeBannedDb(db: BannedDb) {
  writeJson(BANNED_PATH, db);
}

/**
 * Merge the current ONLINE list from Palworld into the history store.
 * - marks all existing players offline
 * - upserts online players with fresh fields + lastSeen
 */
export function mergeOnlinePlayers(
  onlinePlayers: PalworldPlayer[],
  nowIso = new Date().toISOString(),
) {
  const db = readPlayersDb();

  // mark all offline first
  for (const id of Object.keys(db)) {
    db[id]!.online = false;
  }

  for (const p of onlinePlayers) {
    const existing = db[p.userId];
    const firstSeen = existing?.firstSeen ?? nowIso;

    db[p.userId] = {
      userId: p.userId,
      name: p.name,
      accountName: p.accountName,
      playerId: p.playerId,
      ip: p.ip,
      ping: p.ping,
      location_x: p.location_x,
      location_y: p.location_y,
      level: p.level,
      building_count: p.building_count,
      firstSeen,
      lastSeen: nowIso,
      online: true,
    };
  }

  writePlayersDb(db);
}

export function listPlayers() {
  const playersDb = readPlayersDb();
  const bannedDb = readBannedDb();

  const all = Object.values(playersDb);

  const online = all
    .filter((p) => p.online)
    .sort((a, b) => (a.name ?? a.userId).localeCompare(b.name ?? b.userId));

  const offline = all
    .filter((p) => !p.online)
    .sort((a, b) => (a.name ?? a.userId).localeCompare(b.name ?? b.userId));

  const bannedSet = new Set(Object.keys(bannedDb));

  return {
    online,
    offline,
    banned: Array.from(bannedSet),
  };
}

export function markBanned(userId: string, reason?: string) {
  const bannedDb = readBannedDb();
  bannedDb[userId] = { userId, bannedAt: new Date().toISOString(), reason };
  writeBannedDb(bannedDb);
}

export function markUnbanned(userId: string) {
  const bannedDb = readBannedDb();
  delete bannedDb[userId];
  writeBannedDb(bannedDb);
}
