"use client";

import { useState } from "react";

export default function SetupPage() {
  const [baseUrl, setBaseUrl] = useState("http://PALWORLD_SERVER_IP:8212");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/internal/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_url: baseUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Setup failed (HTTP ${res.status})`);
        return;
      }

      window.location.href = "/login";
    } catch {
      setError("Network error while saving config.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <h1 className="card-title text-2xl">First setup</h1>

          <p className="text-sm opacity-80">
            Enter your Palworld server base URL (include port 8212).
          </p>

          <input
            className="input input-bordered w-full"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://192.168.1.50:8212"
          />

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={loading}
            >
              {loading ? "Testing..." : "Test & Save"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
