import { loadConfig } from "@/lib/config";

export async function palworldFetchWithAuth(
  auth: string,
  path: string,
  init: RequestInit = {},
) {
  const { server } = loadConfig();
  const base = server.base_url.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${base}${p}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  });
}
