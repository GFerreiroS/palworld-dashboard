import fs from "fs";
import path from "path";

const PLAYERS_PATH = "/config/players.json";
const BANNED_PATH = "/config/banned.json";

export type PlayerRecord = {
  userId: string;

  // identity
  name?: string;
  accountName?: string;

  playerId?: string;
  ip?: string;
  location_x?: number;
  location_y?: number;
  level?: number;
  building_count?: number;

  // history timestamps
  firstSeen: string; // ISO
  lastSeen: string; // ISO
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

export type PlayerView = PlayerRecord & {
  online: boolean;
  ping: number | null;
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

let dbCache: PlayerDb | null = null;
let dirty = false;

let liveOnline: PalworldPlayer[] = [];
let liveOnlineAtIso: string | null = null;

let lastFlushAt = 0;
const FLUSH_MIN_INTERVAL_MS = 5 * 60_000; // never write more often than every 5 min

function getDb(): PlayerDb {
  if (!dbCache) dbCache = readPlayersDb();
  return dbCache;
}

export function setLiveOnlineSnapshot(
  players: PalworldPlayer[],
  nowIso: string,
) {
  liveOnline = players;
  liveOnlineAtIso = nowIso;

  const db = getDb();

  const nowMs = Date.now();
  const LAST_SEEN_WRITE_EVERY_MS = 5 * 60 * 1000; // 5 minutes

  for (const p of players) {
    const existing = db[p.userId];
    const firstSeen = existing?.firstSeen ?? nowIso;

    const nextStable: Omit<PlayerRecord, "lastSeen"> = {
      userId: p.userId,
      name: p.name,
      accountName: p.accountName,
      playerId: p.playerId,
      ip: p.ip,
      location_x: p.location_x,
      location_y: p.location_y,
      level: p.level,
      building_count: p.building_count,
      firstSeen,
    };

    if (!existing) {
      // new player: write immediately (but still debounced flush)
      db[p.userId] = { ...nextStable, lastSeen: nowIso };
      dirty = true;
      continue;
    }

    // Update stable-ish fields ONLY if they changed
    const keys: (keyof typeof nextStable)[] = [
      "name",
      "accountName",
      "playerId",
      "ip",
      "location_x",
      "location_y",
      "level",
      "building_count",
      "firstSeen",
      "userId",
    ];

    for (const k of keys) {
      if (existing[k] !== nextStable[k]) {
        (existing[k] as unknown) = nextStable[k];
        dirty = true;
      }
    }

    // lastSeen is a checkpoint: only update if the stored value is older than 5 min
    // We compare timestamps safely.
    const prevMs = Date.parse(existing.lastSeen);
    const prevOk = Number.isFinite(prevMs);
    const shouldBump = !prevOk || nowMs - prevMs >= LAST_SEEN_WRITE_EVERY_MS;

    if (shouldBump) {
      existing.lastSeen = nowIso;
      dirty = true;
    }
  }
}

export function maybeFlushPlayersDb(force = false) {
  if (!dbCache) return;
  if (!dirty && !force) return;

  const now = Date.now();
  if (!force && now - lastFlushAt < FLUSH_MIN_INTERVAL_MS) {
    return;
  }

  writePlayersDb(dbCache);
  dirty = false;
  lastFlushAt = now;
}

export function getPlayersView() {
  const db = getDb();
  const bannedDb = readBannedDb();
  const banned = Object.keys(bannedDb);

  const onlineById = new Map<string, PalworldPlayer>();
  for (const p of liveOnline) onlineById.set(p.userId, p);

  const all = Object.values(db);

  const online: PlayerView[] = all
    .filter((p) => onlineById.has(p.userId))
    .map((p) => ({
      ...p,
      ping: Math.round(onlineById.get(p.userId)!.ping),
      online: true,
    }))
    .sort((a, b) => (a.name ?? a.userId).localeCompare(b.name ?? b.userId));

  const offline: PlayerView[] = all
    .filter((p) => !onlineById.has(p.userId))
    .map((p) => ({
      ...p,
      ping: null,
      online: false,
    }))
    .sort((a, b) => (a.name ?? a.userId).localeCompare(b.name ?? b.userId));

  return {
    online,
    offline,
    banned,
    liveOnlineAt: liveOnlineAtIso,
  };
}
