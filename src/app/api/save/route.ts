import { proxyPalworld } from "@/lib/routeProxy";

export async function POST() {
  return proxyPalworld("/v1/api/save", { method: "POST" });
}
