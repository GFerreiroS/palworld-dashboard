"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/internal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Login failed (HTTP ${res.status})`);
        return;
      }

      window.location.href = "/endpoints";
    } catch {
      setError("Network error while logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <h1 className="card-title text-2xl">Login</h1>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Username</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Password</span>
            </div>
            <input
              className="input input-bordered w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              onClick={onLogin}
              disabled={loading}
            >
              {loading ? "Checking..." : "Login"}
            </button>
          </div>

          <p className="text-xs opacity-70">
            Session expires after 30 minutes of inactivity.
          </p>
        </div>
      </div>
    </main>
  );
}
