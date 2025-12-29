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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Endpoints</h1>
        <div className="badge badge-info">DEV view</div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <p className="opacity-70">
            Click GET endpoints to open them. POST endpoints will get forms
            next.
          </p>

          <div className="overflow-x-auto mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th className="text-right"></th>
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

          <div className="alert alert-info mt-4">
            If you get logged out, your session likely expired.
          </div>
        </div>
      </div>
    </div>
  );
}
