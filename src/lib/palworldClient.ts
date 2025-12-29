import { loadConfig } from "@/lib/config";
import { basicAuthHeader } from "@/lib/palworldAuth";

type PalworldFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
};

export async function palworldFetch(
  path: string,
  options: PalworldFetchOptions = {},
): Promise<Response> {
  const { server } = loadConfig();

  const base = server.base_url.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${base}${p}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(server.username, server.password),
    },
    body: options.body,
    cache: "no-store",
  });
}
