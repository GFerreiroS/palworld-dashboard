"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAppConfig } from "@/components/ConfigProvider";

type PlayerView = {
  userId: string;
  name?: string;
  ping: number | null;
  location_x?: number;
  location_y?: number;
  online: boolean;
};

type PlayersPayload = {
  online: PlayerView[];
  offline: PlayerView[];
  banned: string[];
  liveOnlineAt?: string | null;
};

const LeafletMapView = dynamic(() => import("./LeafletMapView"), {
  ssr: false,
});

export default function MapPage() {
  const { refreshSeconds } = useAppConfig();

  const [data, setData] = useState<PlayersPayload | null>(null);
  const online = data?.online ?? [];

  const [error, setError] = useState<string | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  // announce
  const [announceText, setAnnounceText] = useState("");
  const [announceBusy, setAnnounceBusy] = useState(false);
  const [announceOk, setAnnounceOk] = useState<string | null>(null);

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
    const t0 = window.setTimeout(() => void load(false), 0);
    const t = window.setInterval(() => void load(false), refreshSeconds * 1000);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSeconds]);

  async function sendAnnounce() {
    const msg = announceText.trim();
    if (!msg) return;

    setAnnounceBusy(true);
    setAnnounceOk(null);
    setError(null);

    try {
      const res = await fetch("/api/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      if (res.status === 401) {
        setError("Not logged in (session expired).");
        return;
      }
      if (!res.ok) {
        setError(`Announce failed (HTTP ${res.status})`);
        return;
      }

      setAnnounceOk("Announced!");
      setAnnounceText("");
      window.setTimeout(() => setAnnounceOk(null), 2000);
    } catch {
      setError("Network error while announcing");
    } finally {
      setAnnounceBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6">
      {/* Left: Map */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-2xl font-bold">Map</h1>
              <p className="text-sm opacity-60">Drag to pan • Scroll to zoom</p>
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-sm"
                onClick={() => void load(true)}
                disabled={manualRefreshing}
              >
                {manualRefreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error mb-3">{error}</div>}

          <LeafletMapView online={online} />

          {online.length > 0 && (
            <div className="mt-3 text-xs opacity-60">
              Markers are mapped using the same affine transform as the
              reference Leaflet project (stable under zoom).
            </div>
          )}
        </div>
      </div>

      {/* Right: List + Announce */}
      <div className="space-y-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Connected players</h2>
              <div className="text-xs opacity-60">{online.length} online</div>
            </div>

            <div className="overflow-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Steam ID</th>
                    <th className="text-right">Ping</th>
                    <th className="text-right">X</th>
                    <th className="text-right">Y</th>
                  </tr>
                </thead>
                <tbody>
                  {online.map((p) => (
                    <tr key={p.userId}>
                      <td className="truncate max-w-[150px]">
                        {p.name ?? "Unknown"}
                      </td>
                      <td className="font-mono text-xs">{p.userId}</td>
                      <td className="text-right">
                        {typeof p.ping === "number" ? Math.round(p.ping) : ""}
                      </td>
                      <td className="text-right">
                        {typeof p.location_x === "number"
                          ? Math.round(p.location_x)
                          : ""}
                      </td>
                      <td className="text-right">
                        {typeof p.location_y === "number"
                          ? Math.round(p.location_y)
                          : ""}
                      </td>
                    </tr>
                  ))}
                  {online.length === 0 && (
                    <tr>
                      <td colSpan={5} className="opacity-60">
                        No connected players
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data?.liveOnlineAt && (
              <div className="text-xs opacity-60">
                Live snapshot: {data.liveOnlineAt}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <h2 className="text-xl font-bold">Announce</h2>

            <div className="space-y-1">
              <div className="text-sm font-medium opacity-80">Message</div>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                value={announceText}
                onChange={(e) => setAnnounceText(e.target.value)}
                placeholder="Hello, Palworld!"
              />
            </div>

            <div className="flex justify-end items-center gap-3">
              {announceOk && (
                <span className="text-sm text-success">{announceOk}</span>
              )}
              <button
                className="btn btn-primary"
                onClick={() => void sendAnnounce()}
                disabled={announceBusy || announceText.trim().length === 0}
              >
                {announceBusy ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
