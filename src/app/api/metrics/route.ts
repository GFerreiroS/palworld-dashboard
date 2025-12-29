import { proxyPalworld } from "@/lib/routeProxy";

export async function GET() {
  return proxyPalworld("/v1/api/metrics");
}
