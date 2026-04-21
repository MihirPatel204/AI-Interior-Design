import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

const PRO_ENTITLEMENT_ID = "pro_features";
const FREE_RENDER_LIMIT = 1;
const FREE_RENDER_KEY = "interiorai.freeRenderCount";

let initialized = false;
let initPromise: Promise<void> | null = null;

function getApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_SDK_KEY;
  return key && key.trim().length > 0 ? key.trim() : undefined;
}

/** Initialize the RevenueCat SDK exactly once. Safe to call from anywhere. */
export async function initSubscriptions(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      // No-op: paywall will surface a friendly message instead of crashing.
      return;
    }
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
    }
    Purchases.configure({ apiKey });
    initialized = true;
  })();

  return initPromise;
}

/** True if the user currently holds the `pro_features` entitlement. */
export async function isUserPro(): Promise<boolean> {
  try {
    await initSubscriptions();
    if (!initialized) return false;
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active[PRO_ENTITLEMENT_ID]);
  } catch {
    return false;
  }
}

/** Fetch the current offering so the paywall can render real packages. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    await initSubscriptions();
    if (!initialized) return null;
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

/** Run the native purchase flow for a package. Returns updated CustomerInfo. */
export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  await initSubscriptions();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/** Restore previous purchases (e.g. after reinstall or device switch). */
export async function restorePurchases(): Promise<boolean> {
  await initSubscriptions();
  if (!initialized) return false;
  const info = await Purchases.restorePurchases();
  return Boolean(info.entitlements.active[PRO_ENTITLEMENT_ID]);
}

// ---------------------------------------------------------------------------
// Local free-tier counter (persisted with AsyncStorage)
// ---------------------------------------------------------------------------

export async function getFreeRenderCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(FREE_RENDER_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function incrementFreeRenderCount(): Promise<number> {
  const next = (await getFreeRenderCount()) + 1;
  await AsyncStorage.setItem(FREE_RENDER_KEY, String(next));
  return next;
}

export async function hasFreeRenderRemaining(): Promise<boolean> {
  const used = await getFreeRenderCount();
  return used < FREE_RENDER_LIMIT;
}

export const SUBSCRIPTION_CONSTANTS = {
  PRO_ENTITLEMENT_ID,
  FREE_RENDER_LIMIT,
  PLATFORM: Platform.OS,
};
