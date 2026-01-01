"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type DashboardConfig = {
  dashboard: { name: string; refresh_seconds: number };
  server: { base_url: string };
};

type Ctx = {
  config: DashboardConfig | null;
  setConfig: (c: DashboardConfig) => void;
  refreshSeconds: number;
  dashboardName: string;
  reload: () => Promise<void>;
};

const ConfigContext = createContext<Ctx | null>(null);

export function useAppConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useAppConfig must be used inside ConfigProvider");
  return ctx;
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<DashboardConfig | null>(null);

  async function reload() {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as DashboardConfig;
    setConfigState(data);
  }

  useEffect(() => {
    const t0 = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(t0);
  }, []);

  const value = useMemo<Ctx>(() => {
    const dashboardName = config?.dashboard?.name ?? "Palworld Dashboard";
    const refreshSeconds = config?.dashboard?.refresh_seconds ?? 2;

    return {
      config,
      setConfig: (c) => setConfigState(c),
      refreshSeconds,
      dashboardName,
      reload,
    };
  }, [config]);

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}
