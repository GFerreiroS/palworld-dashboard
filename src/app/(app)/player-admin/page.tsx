"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppConfig } from "@/components/ConfigProvider";

type PlayerRecord = {
  userId: string;
  name?: string;
  ping?: number;
  ip?: string;
  accountName?: string;
  playerId?: string;
  location_x?: number;
  location_y?: number;
  level?: number;
  building_count?: number;
  firstSeen: string;
  lastSeen: string;
  online: boolean;
};

type PlayersPayload = {
  online: PlayerRecord[];
  offline: PlayerRecord[];
  banned: string[];
};

type MenuState = {
  open: boolean;
  x: number;
  y: number;
  player: PlayerRecord | null;
};

type ActionModal =
  | { type: "kick"; player: PlayerRecord }
  | { type: "ban"; player: PlayerRecord }
  | { type: "unban"; player: PlayerRecord }
  | null;

export default function PlayerAdminPage() {
  const { refreshSeconds } = useAppConfig();

  const [data, setData] = useState<PlayersPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const [menu, setMenu] = useState<MenuState>({
    open: false,
    x: 0,
    y: 0,
    player: null,
  });
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [infoPlayer, setInfoPlayer] = useState<PlayerRecord | null>(null);

  const [message, setMessage] = useState("");

  const bannedSet = useMemo(() => new Set(data?.banned ?? []), [data]);

  async function load(isManual = false) {
    if (isManual) setManualRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/players", { cache: "no-store" });
      if (res.status === 401) {
        setError("Not logged in (session expired).");
        return;
      }
      if (!res.ok) {
        setError(`Failed to load players (HTTP ${res.status})`);
        return;
      }
      const json = (await res.json()) as PlayersPayload;
      setData(json);
    } catch {
      setError("Network error while loading players");
    } finally {
      if (isManual) setManualRefreshing(false);
    }
  }

  useEffect(() => {
    const t0 = window.setTimeout(() => void load(), 0);
    const t = window.setInterval(() => void load(), refreshSeconds * 1000);

    const onClick = () => {
      if (menu.open) setMenu((m) => ({ ...m, open: false, player: null }));
    };

    window.addEventListener("click", onClick);
    window.addEventListener("scroll", onClick, true);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onClick, true);
    };
  }, [refreshSeconds, menu.open]);

  function openMenu(e: React.MouseEvent, player: PlayerRecord) {
    e.preventDefault();
    setMenu({ open: true, x: e.clientX, y: e.clientY, player });
  }

  function openKick(player: PlayerRecord) {
    setMessage("You are kicked.");
    setActionModal({ type: "kick", player });
    setMenu({ open: false, x: 0, y: 0, player: null });
  }

  function openBan(player: PlayerRecord) {
    setMessage("You are banned.");
    setActionModal({ type: "ban", player });
    setMenu({ open: false, x: 0, y: 0, player: null });
  }

  function openUnban(player: PlayerRecord) {
    setMessage("");
    setActionModal({ type: "unban", player });
    setMenu({ open: false, x: 0, y: 0, player: null });
  }

  async function runAction() {
    if (!actionModal) return;

    const player = actionModal.player;

    try {
      if (actionModal.type === "kick") {
        const res = await fetch("/api/kick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: player.userId, message }),
        });
        if (!res.ok) throw new Error(`kick ${res.status}`);
      }

      if (actionModal.type === "ban") {
        const res = await fetch("/api/ban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: player.userId, message }),
        });
        if (!res.ok) throw new Error(`ban ${res.status}`);
      }

      if (actionModal.type === "unban") {
        const res = await fetch("/api/unban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: player.userId }),
        });
        if (!res.ok) throw new Error(`unban ${res.status}`);
      }

      setActionModal(null);
      setMessage("");
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Action failed";
      setError(msg);
      setActionModal(null);
    }
  }

  const online = data?.online ?? [];
  const offline = data?.offline ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Player admin</h1>
          <p className="opacity-70">
            All players seen by the dashboard. Right-click for actions.
          </p>
        </div>

        <button
          className="btn btn-sm"
          onClick={() => void load()}
          disabled={manualRefreshing}
        >
          {manualRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PlayersCard
          title={`Online (${online.length})`}
          players={online}
          bannedSet={bannedSet}
          onRightClick={openMenu}
          onLeftClick={(p) => setInfoPlayer(p)}
        />

        <PlayersCard
          title={`Offline (${offline.length})`}
          players={offline}
          bannedSet={bannedSet}
          onRightClick={openMenu}
          onLeftClick={(p) => setInfoPlayer(p)}
        />
      </div>

      {/* Context menu */}
      {menu.open && menu.player && (
        <div
          className="fixed z-50"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card bg-base-100 shadow-xl border border-base-300 w-52">
            <div className="card-body p-2">
              <div className="text-sm font-semibold px-2 py-1 truncate">
                {menu.player.name ?? menu.player.userId}
              </div>
              <div className="divider my-1" />

              <button
                className="btn btn-ghost justify-start"
                onClick={() => openKick(menu.player!)}
              >
                Kick…
              </button>

              {bannedSet.has(menu.player.userId) ? (
                <button
                  className="btn btn-ghost justify-start"
                  onClick={() => openUnban(menu.player!)}
                >
                  Unban
                </button>
              ) : (
                <button
                  className="btn btn-ghost justify-start"
                  onClick={() => openBan(menu.player!)}
                >
                  Ban…
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full info modal */}
      {infoPlayer && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {infoPlayer.name ?? "Unknown player"}
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <Row k="Steam ID (userId)" v={infoPlayer.userId} />
              <Row k="Ping" v={String(infoPlayer.ping ?? "")} />
              <Row k="Account" v={infoPlayer.accountName ?? ""} />
              <Row k="Player ID" v={infoPlayer.playerId ?? ""} />
              <Row k="IP" v={infoPlayer.ip ?? ""} />
              <Row k="Level" v={String(infoPlayer.level ?? "")} />
              <Row k="Buildings" v={String(infoPlayer.building_count ?? "")} />
              <Row
                k="Location"
                v={`${infoPlayer.location_x ?? ""}, ${infoPlayer.location_y ?? ""}`}
              />
              <Row k="First seen" v={infoPlayer.firstSeen} />
              <Row k="Last seen" v={infoPlayer.lastSeen} />
              <Row k="Online" v={infoPlayer.online ? "true" : "false"} />
              <Row
                k="Banned (tracked)"
                v={bannedSet.has(infoPlayer.userId) ? "true" : "false"}
              />
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setInfoPlayer(null)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setInfoPlayer(null)} />
        </div>
      )}

      {/* Action modal (kick/ban/unban) */}
      {actionModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {actionModal.type === "kick" && "Kick player"}
              {actionModal.type === "ban" && "Ban player"}
              {actionModal.type === "unban" && "Unban player"}
            </h3>

            <div className="mt-2 text-sm opacity-80">
              {actionModal.player.name ?? actionModal.player.userId}
            </div>

            {(actionModal.type === "kick" || actionModal.type === "ban") && (
              <div className="mt-4 space-y-1">
                <div className="text-sm font-medium opacity-80">Message</div>
                <input
                  className="input input-bordered w-full"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional message"
                />
              </div>
            )}

            <div className="modal-action">
              <button className="btn" onClick={() => setActionModal(null)}>
                Cancel
              </button>
              <button
                className={`btn ${
                  actionModal.type === "ban"
                    ? "btn-warning"
                    : actionModal.type === "kick"
                      ? "btn-error"
                      : "btn-primary"
                }`}
                onClick={() => void runAction()}
              >
                Confirm
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setActionModal(null)}
          />
        </div>
      )}
    </div>
  );
}

function PlayersCard({
  title,
  players,
  bannedSet,
  onRightClick,
  onLeftClick,
}: {
  title: string;
  players: PlayerRecord[];
  bannedSet: Set<string>;
  onRightClick: (e: React.MouseEvent, p: PlayerRecord) => void;
  onLeftClick: (p: PlayerRecord) => void;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="text-xl font-bold">{title}</h2>

        <div className="overflow-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Steam ID</th>
                <th className="text-right">Ping</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.userId}
                  className="hover"
                  onContextMenu={(e) => onRightClick(e, p)}
                  onClick={() => onLeftClick(p)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-55">
                        {p.name ?? "Unknown"}
                      </span>
                      {bannedSet.has(p.userId) && (
                        <span className="badge badge-warning badge-sm">
                          banned
                        </span>
                      )}
                      {p.online && (
                        <span className="badge badge-success badge-sm">
                          online
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{p.userId}</td>
                  <td className="text-right">{p.ping ?? ""}</td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={3} className="opacity-60">
                    No players
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="opacity-70">{k}</div>
      <div className="text-right break-all">{v}</div>
    </div>
  );
}
