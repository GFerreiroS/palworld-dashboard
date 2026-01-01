"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppConfig } from "@/components/ConfigProvider";
import { Activity, Users, Cpu, Clock, Server } from "lucide-react";

type PalMetrics = {
  serverfps: number;
  currentplayernum: number;
  serverframetime: number;
  maxplayernum: number;
  uptime: number;
  days: number;
};

type PalSettings = {
  ServerName?: string;
  ServerDescription?: string;
  ServerPlayerMaxNum?: number;
  PublicIP?: string;
  PublicPort?: number;
  RESTAPIPort?: number;
  Difficulty?: string;
};

type SystemStats = {
  cpu: { load1: number; cpuCount: number; load1PerCore: number };
  memory: { total: number; used: number; free: number; usedPct: number };
  uptimeSeconds: number;
};

function fmtSeconds(total: number) {
  const s = Math.max(0, Math.floor(total));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

function bytesToGiB(b: number) {
  return b / 1024 / 1024 / 1024;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<PalMetrics | null>(null);
  const [settings, setSettings] = useState<PalSettings | null>(null);
  const [sys, setSys] = useState<SystemStats | null>(null);

  const [errorLive, setErrorLive] = useState<string | null>(null);
  const [errorSettings, setErrorSettings] = useState<string | null>(null);

  const { refreshSeconds } = useAppConfig();

  async function loadLive() {
    setErrorLive(null);
    try {
      const [m, y] = await Promise.all([
        fetch("/api/metrics", { cache: "no-store" }),
        fetch("/api/system", { cache: "no-store" }),
      ]);

      if (m.status === 401) {
        setErrorLive("Not logged in (session expired).");
        return;
      }

      if (!m.ok) throw new Error(`metrics ${m.status}`);
      if (!y.ok) throw new Error(`system ${y.status}`);

      setMetrics(await m.json());
      setSys(await y.json());
    } catch (err: unknown) {
      if (err instanceof Error) setErrorLive(err.message);
      else setErrorLive("Failed to load live data");
    }
  }

  async function loadSettingsOnce() {
    setErrorSettings(null);
    try {
      const s = await fetch("/api/settings", { cache: "no-store" });

      if (s.status === 401) {
        setErrorSettings("Not logged in (session expired).");
        return;
      }

      if (!s.ok) throw new Error(`settings ${s.status}`);

      setSettings(await s.json());
    } catch (err: unknown) {
      if (err instanceof Error) setErrorSettings(err.message);
      else setErrorSettings("Failed to load settings");
    }
  }

  useEffect(() => {
    const t0 = window.setTimeout(() => {
      void loadLive();
      void loadSettingsOnce();
    }, 0);

    const t = window.setInterval(() => {
      void loadLive();
    }, refreshSeconds * 1000);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, [refreshSeconds]);

  const playersLabel = useMemo(() => {
    if (!metrics) return "--/--";
    return `${metrics.currentplayernum}/${metrics.maxplayernum}`;
  }, [metrics]);

  const palUptime = useMemo(
    () => (metrics ? fmtSeconds(metrics.uptime) : "--"),
    [metrics],
  );
  const hostUptime = useMemo(
    () => (sys ? fmtSeconds(sys.uptimeSeconds) : "--"),
    [sys],
  );

  const cpuText = useMemo(() => {
    if (!sys) return "--";
    const approx = Math.min(100, Math.max(0, sys.cpu.load1PerCore * 100));
    return fmtPct(approx);
  }, [sys]);

  const memText = useMemo(() => {
    if (!sys) return "--";
    return fmtPct(sys.memory.usedPct);
  }, [sys]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Activity className="text-primary" size={22} />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Server Statistics</h1>
          <p className="opacity-60">Real-time monitoring and insights</p>
        </div>
      </div>

      {errorLive && <div className="alert alert-error">{errorLive}</div>}
      {errorSettings && (
        <div className="alert alert-warning">{errorSettings}</div>
      )}

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Players Online"
          value={playersLabel}
          subtitle="Active connections"
          icon={<Users className="text-primary" size={28} />}
        />
        <StatCard
          title="CPU Usage"
          value={cpuText}
          subtitle="Host load"
          icon={<Cpu className="text-primary" size={28} />}
        />
        <StatCard
          title="Memory"
          value={memText}
          subtitle="RAM usage"
          icon={<Server className="text-primary" size={28} />}
        />
        <StatCard
          title="Uptime"
          value={palUptime}
          subtitle="Server running"
          icon={<Clock className="text-primary" size={28} />}
        />
      </div>

      {/* Two info panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Server className="text-primary" size={18} />
              </div>
              <h2 className="text-2xl font-bold">Server Information</h2>
            </div>

            <div className="divider my-2" />

            <div className="space-y-3">
              <Row label="Server Name" value={settings?.ServerName ?? "--"} />
              <Row
                label="Description"
                value={settings?.ServerDescription ?? "--"}
              />
              <Row
                label="Max Players"
                value={(
                  settings?.ServerPlayerMaxNum ??
                  metrics?.maxplayernum ??
                  "--"
                ).toString()}
              />
              <Row
                label="Public"
                value={
                  settings?.PublicIP
                    ? `${settings.PublicIP}:${settings?.PublicPort ?? ""}`
                    : "--"
                }
              />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Activity className="text-primary" size={18} />
              </div>
              <h2 className="text-2xl font-bold">Palworld Server Info</h2>
            </div>

            <div className="divider my-2" />

            <div className="space-y-3">
              <Row
                label="Server FPS"
                value={metrics ? `${metrics.serverfps}` : "--"}
              />
              <Row
                label="Frame time"
                value={
                  metrics ? `${metrics.serverframetime.toFixed(2)} ms` : "--"
                }
              />
              <Row
                label="In-game days"
                value={metrics ? `${metrics.days}` : "--"}
              />
              <Row label="Host Uptime" value={hostUptime} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
          <div className="divider my-2" />

          <div className="space-y-6">
            <MetricBar
              label="CPU (approx)"
              valuePct={
                sys ? Math.min(100, Math.max(0, sys.cpu.load1PerCore * 100)) : 0
              }
              rightText={cpuText}
            />
            <MetricBar
              label="Memory"
              valuePct={sys ? sys.memory.usedPct : 0}
              rightText={
                sys
                  ? `${memText} (${bytesToGiB(sys.memory.used).toFixed(1)} / ${bytesToGiB(sys.memory.total).toFixed(1)} GiB)`
                  : "--"
              }
            />
            <MetricBar
              label="Player Capacity"
              valuePct={
                metrics
                  ? (metrics.currentplayernum /
                      Math.max(1, metrics.maxplayernum)) *
                    100
                  : 0
              }
              rightText={playersLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div>
            <div className="opacity-70">{title}</div>
            <div className="text-primary text-lg font-semibold">{value}</div>
            <div className="opacity-60 text-sm">{subtitle}</div>
          </div>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="opacity-70">{label}</div>
      <div className="font-medium text-right">{value}</div>
    </div>
  );
}

function MetricBar({
  label,
  valuePct,
  rightText,
}: {
  label: string;
  valuePct: number;
  rightText: string;
}) {
  const pct = Number.isFinite(valuePct)
    ? Math.min(100, Math.max(0, valuePct))
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{label}</div>
        <div className="opacity-70">{rightText}</div>
      </div>
      <progress
        className="progress progress-primary w-full"
        value={pct}
        max={100}
      />
    </div>
  );
}
