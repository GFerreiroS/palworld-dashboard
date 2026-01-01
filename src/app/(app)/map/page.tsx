"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAppConfig } from "@/components/ConfigProvider";
import { mapToPixels, worldToMap } from "@/lib/palworldCoords";

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

type Size = { w: number; h: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const MAP_PX = 8192;

function computeFitTransform(container: Size) {
  // Fit the whole 8192x8192 image into container
  const s = Math.min(container.w / MAP_PX, container.h / MAP_PX);
  const tx = (container.w - MAP_PX * s) / 2;
  const ty = (container.h - MAP_PX * s) / 2;
  return { scale: s, tx, ty };
}

function clampTransform(
  container: Size,
  scale: number,
  tx: number,
  ty: number,
) {
  const imgW = MAP_PX * scale;
  const imgH = MAP_PX * scale;

  // If image bigger than container: allow panning but clamp so no empty space
  // If image smaller: keep it centered (no panning)
  const minTx =
    imgW > container.w ? container.w - imgW : (container.w - imgW) / 2;
  const maxTx = imgW > container.w ? 0 : (container.w - imgW) / 2;

  const minTy =
    imgH > container.h ? container.h - imgH : (container.h - imgH) / 2;
  const maxTy = imgH > container.h ? 0 : (container.h - imgH) / 2;

  return {
    tx: clamp(tx, minTx, maxTx),
    ty: clamp(ty, minTy, maxTy),
  };
}

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

  // map interaction
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<Size | null>(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const dragRef = useRef<{
    dragging: boolean;
    sx: number;
    sy: number;
    stx: number;
    sty: number;
  }>({
    dragging: false,
    sx: 0,
    sy: 0,
    stx: 0,
    sty: 0,
  });

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

  // Poll players (same cadence as elsewhere)
  useEffect(() => {
    const t0 = window.setTimeout(() => void load(false), 0);
    const t = window.setInterval(() => void load(false), refreshSeconds * 1000);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSeconds]);

  // Track container size with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: r.width, h: r.height });
    });

    obs.observe(el);

    // initial
    const r = el.getBoundingClientRect();
    setContainerSize({ w: r.width, h: r.height });

    return () => obs.disconnect();
  }, []);

  // Fit-to-view once container size is known (and whenever it changes)
  useEffect(() => {
    if (!containerSize) return;
    const fit = computeFitTransform(containerSize);
    setScale(fit.scale);
    setTx(fit.tx);
    setTy(fit.ty);
  }, [containerSize?.w, containerSize?.h]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetView() {
    if (!containerSize) return;
    const fit = computeFitTransform(containerSize);
    setScale(fit.scale);
    setTx(fit.tx);
    setTy(fit.ty);
  }

  // Wheel zoom around cursor, clamped to bounds
  function onWheel(e: React.WheelEvent) {
    if (!containerSize) return;
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const nextScale = clamp(scale * zoomFactor, 0.2, 6);

    const k = nextScale / scale;

    // zoom around mouse point
    const rawTx = mx - k * (mx - tx);
    const rawTy = my - k * (my - ty);

    const clamped = clampTransform(containerSize, nextScale, rawTx, rawTy);

    setScale(nextScale);
    setTx(clamped.tx);
    setTy(clamped.ty);
  }

  // Drag pan, clamped
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      dragging: true,
      sx: e.clientX,
      sy: e.clientY,
      stx: tx,
      sty: ty,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!containerSize) return;
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;

    const rawTx = dragRef.current.stx + dx;
    const rawTy = dragRef.current.sty + dy;

    const clamped = clampTransform(containerSize, scale, rawTx, rawTy);
    setTx(clamped.tx);
    setTy(clamped.ty);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  const markers = useMemo(() => {
    return (
      online
        .filter(
          (p) =>
            typeof p.location_x === "number" &&
            typeof p.location_y === "number",
        )
        .map((p) => {
          const wx = p.location_x as number;
          const wy = p.location_y as number;

          const { mx, my } = worldToMap(wx, wy);
          const { px, py } = mapToPixels(mx, my);

          return { p, px, py };
        })
        // Only render markers that land inside the image bounds
        .filter(
          (m) =>
            Number.isFinite(m.px) &&
            Number.isFinite(m.py) &&
            m.px >= 0 &&
            m.px <= MAP_PX &&
            m.py >= 0 &&
            m.py <= MAP_PX,
        )
    );
  }, [online]);

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
                onClick={resetView}
                disabled={!containerSize}
              >
                Fit
              </button>
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

          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-xl border border-base-300 bg-base-200"
            style={{ height: "72vh", touchAction: "none" }}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              }}
            >
              <img
                src="/maps/palworld.webp"
                alt="Palworld map"
                draggable={false}
                width={MAP_PX}
                height={MAP_PX}
              />

              {/* Markers */}
              {markers.map(({ p, px, py }) => (
                <div
                  key={p.userId}
                  className="absolute"
                  style={{ left: px, top: py }}
                >
                  <div className="relative -translate-x-1/2 -translate-y-full pointer-events-none select-none">
                    <div className="text-xs font-semibold px-2 py-1 rounded-lg bg-base-100/90 border border-base-300 shadow whitespace-nowrap">
                      {p.name ?? "Unknown"}
                    </div>
                    <div className="w-3 h-3 rounded-full bg-primary border-2 border-base-100 shadow mx-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>

            {/* Helpful empty-state */}
            {online.length > 0 && markers.length === 0 && (
              <div className="absolute inset-x-3 bottom-3">
                <div className="alert alert-warning text-sm">
                  Players are online, but markers are outside the map bounds.
                  The world→map scaling may need a one-time tweak.
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs opacity-60">
            Markers render only if their computed pixel position lands inside
            the 8192×8192 image.
          </div>
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
                        {typeof p.ping === "number" ? p.ping : ""}
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

            {announceOk && (
              <div className="alert alert-success">{announceOk}</div>
            )}

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

            <div className="flex justify-end">
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
