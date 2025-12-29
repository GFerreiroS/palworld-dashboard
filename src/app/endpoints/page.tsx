"use client";

const endpoints = [
  { method: "GET", path: "/api/info" },
  { method: "GET", path: "/api/players" },
  { method: "GET", path: "/api/settings" },
  { method: "GET", path: "/api/metrics" },

  { method: "POST", path: "/api/announce" },
  { method: "POST", path: "/api/kick" },
  { method: "POST", path: "/api/ban" },
  { method: "POST", path: "/api/unban" },
  { method: "POST", path: "/api/save" },
  { method: "POST", path: "/api/stop" },
  { method: "POST", path: "/api/shutdown" },
];

export default function EndpointsPage() {
  return (
    <main className="min-h-screen bg-base-200 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-4">
            <h1 className="card-title text-2xl">Endpoints</h1>
            <p className="text-sm opacity-80">
              Click a GET endpoint to open it. POST endpoints will be wired
              later with forms.
            </p>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Path</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((e) => (
                    <tr key={`${e.method}:${e.path}`}>
                      <td>
                        <span
                          className={`badge ${e.method === "GET" ? "badge-success" : "badge-warning"}`}
                        >
                          {e.method}
                        </span>
                      </td>
                      <td className="font-mono">{e.path}</td>
                      <td className="text-right">
                        {e.method === "GET" ? (
                          <a
                            className="btn btn-sm"
                            href={e.path}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="opacity-60 text-sm">Form later</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="alert alert-info">
              If you get 401, you’re not logged in (or session expired).
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
