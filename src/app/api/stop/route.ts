import { proxyPalworld } from "@/lib/routeProxy";

export async function POST() {
  return proxyPalworld("/v1/api/stop", { method: "POST" });
}
