"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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

      router.push("/");
    } catch {
      setError("Network error while logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="text-primary" size={32} />
            </div>
            <h1 className="text-3xl font-bold">Palworld Dashboard</h1>
            <p className="opacity-60 mt-2">
              Login with your server credentials
            </p>
          </div>

          <form onSubmit={onLogin} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Checking..." : "Login"}
            </button>

            <p className="text-xs opacity-70 text-center">
              Session expires after 30 minutes of inactivity.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
