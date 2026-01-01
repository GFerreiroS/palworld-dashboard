"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAppConfig,
  type DashboardConfig,
} from "@/components/ConfigProvider";

export default function SettingsPage() {
  const { config, setConfig, reload } = useAppConfig();

  const [draft, setDraft] = useState<DashboardConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [showUrlWarning, setShowUrlWarning] = useState(false);

  useEffect(() => {
    // ensure we have config loaded
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  const baseUrlChanged = useMemo(() => {
    if (!config || !draft) return false;
    return config.server.base_url !== draft.server.base_url;
  }, [config, draft]);

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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Save failed (HTTP ${res.status})`);
        return;
      }

      // Update global config immediately (live changes)
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
          Dashboard settings and server connection config.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      {/* Dashboard settings */}
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <h2 className="text-2xl font-bold">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Dashboard name</span>
              </label>
              <input
                className="input input-bordered"
                value={draft.dashboard.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    dashboard: { ...draft.dashboard, name: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Refresh seconds</span>
              </label>
              <input
                type="number"
                min={1}
                max={60}
                className="input input-bordered"
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
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Applies immediately to live polling.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Server settings */}
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <h2 className="text-2xl font-bold">Server</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Base URL</span>
            </label>
            <input
              className={`input input-bordered ${baseUrlChanged ? "input-warning" : ""}`}
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
              <label className="label">
                <span className="label-text-alt text-warning">
                  Changing this can disconnect the dashboard.
                </span>
              </label>
            )}
          </div>
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

        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Warning modal */}
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
