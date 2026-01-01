"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAppConfig,
  type DashboardConfig,
} from "@/components/ConfigProvider";

type PalworldSettings = Record<string, unknown>;

function normalizeValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "true" : "false";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium opacity-80">{label}</div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { config, setConfig, reload } = useAppConfig();

  const [draft, setDraft] = useState<DashboardConfig | null>(null);
  const [serverSettings, setServerSettings] = useState<PalworldSettings | null>(
    null,
  );

  const [saving, setSaving] = useState(false);
  const [loadingServer, setLoadingServer] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [showUrlWarning, setShowUrlWarning] = useState(false);

  useEffect(() => {
    const t0 = window.setTimeout(() => {
      void (async () => {
        try {
          await reload();
        } catch {
          // ignore
        }

        try {
          setLoadingServer(true);
          const res = await fetch("/api/settings", { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as PalworldSettings;
            setServerSettings(data);
          } else {
            setServerSettings(null);
          }
        } catch {
          setServerSettings(null);
        } finally {
          setLoadingServer(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  const baseUrlChanged = useMemo(() => {
    if (!config || !draft) return false;
    return config.server.base_url !== draft.server.base_url;
  }, [config, draft]);

  const sortedServerKeys = useMemo(() => {
    if (!serverSettings) return [];
    return Object.keys(serverSettings).sort((a, b) => a.localeCompare(b));
  }, [serverSettings]);

  async function saveNow() {
    if (!draft) return;

    setSaving(true);
    setError(null);
    setOk(null);

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data?.error ?? `Save failed (HTTP ${res.status})`);
        return;
      }

      setConfig(draft);
      setOk("Saved!");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
      setShowUrlWarning(false);
    }
  }

  async function onSave() {
    if (baseUrlChanged) {
      setShowUrlWarning(true);
      return;
    }
    await saveNow();
  }

  async function refreshServerSettings() {
    setError(null);
    setOk(null);
    setLoadingServer(true);

    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) {
        setError(`Failed to load /api/settings (HTTP ${res.status})`);
        return;
      }
      const data = (await res.json()) as PalworldSettings;
      setServerSettings(data);
    } catch {
      setError("Network error while loading /api/settings");
    } finally {
      setLoadingServer(false);
    }
  }

  if (!draft) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">Loading settings…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="opacity-70">
          Dashboard config + server settings (read-only).
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      {/* Dashboard settings (config.yml) */}
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-5">
          <h2 className="text-2xl font-bold">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Dashboard name">
              <input
                className="input input-bordered w-full"
                value={draft.dashboard.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    dashboard: { ...draft.dashboard, name: e.target.value },
                  })
                }
              />
            </Field>

            <Field label="Refresh seconds">
              <input
                type="number"
                min={1}
                max={60}
                className="input input-bordered w-full"
                value={draft.dashboard.refresh_seconds}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    dashboard: {
                      ...draft.dashboard,
                      refresh_seconds: Number(e.target.value || 2),
                    },
                  })
                }
              />
              <div className="text-xs opacity-60 mt-1">
                Applies immediately.
              </div>
            </Field>

            {/* You moved URL input into dashboard section */}
            <div className="md:col-span-2">
              <Field label="Palworld server base URL">
                <input
                  className={`input input-bordered w-full ${baseUrlChanged ? "input-warning" : ""}`}
                  value={draft.server.base_url}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      server: { ...draft.server, base_url: e.target.value },
                    })
                  }
                  placeholder="http://IP:8212"
                />
                {baseUrlChanged && (
                  <div className="text-xs text-warning mt-1">
                    Changing this can disconnect the dashboard.
                  </div>
                )}
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => setDraft(config!)}
              disabled={saving}
            >
              Reset
            </button>

            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Server settings (/api/settings) read-only */}
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Server settings (read-only)</h2>
            <button
              className="btn btn-sm"
              onClick={refreshServerSettings}
              disabled={loadingServer}
            >
              {loadingServer ? "Loading…" : "Refresh"}
            </button>
          </div>

          <p className="opacity-70">
            Values come from{" "}
            <code className="px-1 rounded bg-base-200">/api/settings</code>.
            Display only (disabled inputs).
          </p>

          <div className="divider my-1" />

          {!serverSettings ? (
            <div className="alert alert-warning">
              Could not load server settings. Make sure you’re logged in and the
              server is reachable.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedServerKeys.map((key) => (
                <Field key={key} label={key}>
                  <input
                    className="input input-bordered w-full"
                    value={normalizeValue(serverSettings[key])}
                    disabled
                    readOnly
                  />
                </Field>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Warning modal for base_url change */}
      {showUrlWarning && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Change server URL?</h3>
            <p className="py-4 opacity-80">
              You changed{" "}
              <code className="px-1 rounded bg-base-200">server.base_url</code>.
              This may break the dashboard if the server is wrong or
              unreachable. Are you sure?
            </p>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowUrlWarning(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={saveNow}
                disabled={saving}
              >
                Yes, change it
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowUrlWarning(false)}
          />
        </div>
      )}
    </div>
  );
}
