import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Load expo-application lazily and defensively — if the native module isn't
// linked yet (e.g. first run after install, or running on web) we fall back to
// a generated ID so the client still works.
let Application: {
  getIosIdForVendorAsync?: () => Promise<string | null>;
  getAndroidId?: () => string | null;
} | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Application = require("expo-application");
} catch {
  Application = null;
}

/**
 * Resolve the API server base URL.
 * Order of precedence:
 *  1. `EXPO_PUBLIC_API_URL` (explicit override)
 *  2. Derived from the current Replit dev domain (`EXPO_PUBLIC_DOMAIN`) —
 *     assumes the api-server is proxied under `/` on the same host, so
 *     requests go to `https://<dev-domain>/api/...`.
 *  3. `http://localhost:3000` as a final local fallback.
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/+$/, "");
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain && domain.trim().length > 0) {
    const cleaned = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${cleaned}`;
  }
  return "http://localhost:3000";
}

const DEVICE_ID_KEY = "@interiorai:deviceId";
let cachedDeviceId: string | null = null;

/**
 * Stable per-install ID used by the backend to key quota + rate limits.
 * Uses the native install ID when available and falls back to a generated
 * random ID persisted in AsyncStorage.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch {
    // ignore storage failures
  }

  let id: string | null = null;
  try {
    if (Platform.OS === "ios" && Application?.getIosIdForVendorAsync) {
      id = await Application.getIosIdForVendorAsync();
    } else if (Platform.OS === "android" && Application?.getAndroidId) {
      id = Application.getAndroidId();
    }
  } catch {
    id = null;
  }

  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  }

  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore
  }
  cachedDeviceId = id;
  return id;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: unknown;
  constructor(
    message: string,
    status: number,
    code?: string,
    payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 90_000,
): Promise<T> {
  const base = getApiBaseUrl();
  const deviceId = await getDeviceId();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-device-id": deviceId,
        ...(init.headers ?? {}),
      },
    });

    const text = await res.text();
    const parsed = text ? safeJson(text) : null;

    if (!res.ok) {
      const message =
        (parsed as { message?: string } | null)?.message ??
        `Request failed (${res.status})`;
      const code = (parsed as { error?: string } | null)?.error;
      throw new ApiError(message, res.status, code, parsed);
    }

    return parsed as T;
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
