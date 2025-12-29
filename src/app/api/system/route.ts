import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Simple CPU/load signal (not %). We'll display it nicely on UI.
  const load1 = os.loadavg()[0] ?? 0;
  const cpuCount = os.cpus()?.length ?? 1;

  // Uptime in seconds (host/kernel uptime)
  const uptime = os.uptime();

  return NextResponse.json({
    cpu: {
      load1,
      cpuCount,
      load1PerCore: cpuCount > 0 ? load1 / cpuCount : load1,
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usedPct: totalMem > 0 ? (usedMem / totalMem) * 100 : 0,
    },
    uptimeSeconds: uptime,
  });
}
