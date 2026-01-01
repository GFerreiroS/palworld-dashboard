"use client";

import { useEffect, useState } from "react";

export default function LogsPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/logs", { cache: "no-store" });
      if (!res.ok) {
        setError("Failed to load logs");
        return;
      }
      const data = await res.json();
      setLines(data.lines ?? []);
    } catch {
      setError("Failed to load logs");
    }
  }

  useEffect(() => {
    const t0 = window.setTimeout(() => {
      void load();
    }, 0);

    const t = window.setInterval(() => {
      void load();
    }, 2000);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(t);
    };
  }, []);

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h1 className="text-2xl font-bold">Application Logs</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <pre className="bg-base-200 p-4 rounded-lg max-h-[70vh] overflow-auto text-xs">
          {lines.join("\n")}
        </pre>
      </div>
    </div>
  );
}
