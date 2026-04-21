/**
 * Simple in-memory usage tracker keyed by deviceId.
 * Tracks total renders per device so the server can enforce a free-tier quota
 * even if the client forgets or tries to bypass its local counter.
 *
 * Not persistent — resets on server restart. Good enough for a single-process
 * dev/demo deployment. Swap for Drizzle-backed storage when you're ready.
 */

export const FREE_RENDER_LIMIT = 1;

interface DeviceRecord {
  deviceId: string;
  renders: number;
  analyses: number;
  pro: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

const devices = new Map<string, DeviceRecord>();

function touch(deviceId: string): DeviceRecord {
  let rec = devices.get(deviceId);
  const now = new Date().toISOString();
  if (!rec) {
    rec = {
      deviceId,
      renders: 0,
      analyses: 0,
      pro: false,
      firstSeenAt: now,
      lastSeenAt: now,
    };
    devices.set(deviceId, rec);
  }
  rec.lastSeenAt = now;
  return rec;
}

export function getUsage(deviceId: string): {
  deviceId: string;
  renders: number;
  analyses: number;
  pro: boolean;
  remaining: number;
  limit: number;
} {
  const rec = touch(deviceId);
  const remaining = rec.pro
    ? Number.POSITIVE_INFINITY
    : Math.max(FREE_RENDER_LIMIT - rec.renders, 0);
  return {
    deviceId: rec.deviceId,
    renders: rec.renders,
    analyses: rec.analyses,
    pro: rec.pro,
    remaining: rec.pro ? -1 : remaining,
    limit: FREE_RENDER_LIMIT,
  };
}

export function canRender(deviceId: string): boolean {
  const rec = touch(deviceId);
  if (rec.pro) return true;
  return rec.renders < FREE_RENDER_LIMIT;
}

export function incrementRender(deviceId: string): void {
  const rec = touch(deviceId);
  rec.renders += 1;
}

export function incrementAnalysis(deviceId: string): void {
  const rec = touch(deviceId);
  rec.analyses += 1;
}

export function setPro(deviceId: string, pro: boolean): void {
  const rec = touch(deviceId);
  rec.pro = pro;
}
