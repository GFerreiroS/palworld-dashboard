"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
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

      const data = (await res.json().catch(() => ({}))) as { error?: string };
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
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <Image
                src="/palworld-dashboard-logo.png"
                alt="Palworld Dashboard"
                width={256}
                height={256}
                className="w-24 h-24 object-contain"
                priority
              />
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
          </form>
        </div>
      </div>
    </main>
  );
}
