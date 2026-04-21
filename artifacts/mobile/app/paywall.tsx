import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Stack, router } from "expo-router";
import {
  Check,
  Crown,
  Sparkles,
  X,
  Zap,
  ImageIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";
import {
  getCurrentOffering,
  initSubscriptions,
  purchasePackage,
  restorePurchases,
} from "@/services/subscriptionService";

const BENEFITS: { icon: React.ComponentType<any>; title: string; desc: string }[] = [
  {
    icon: Sparkles,
    title: "Unlimited AI Renders",
    desc: "Reimagine every room, in every style — no monthly cap.",
  },
  {
    icon: ImageIcon,
    title: "High-Resolution Exports",
    desc: "Save your designs in crisp 4K, ready to share or print.",
  },
  {
    icon: Zap,
    title: "Priority Processing",
    desc: "Skip the queue. Get faster Gemini generations, every time.",
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initSubscriptions();
        const offering = await getCurrentOffering();
        if (cancelled) return;
        setPkg(offering?.monthly ?? offering?.availablePackages?.[0] ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const priceLabel = pkg?.product.priceString ?? "$9.99";
  const periodLabel = "/mo";

  const handlePurchase = async () => {
    if (purchasing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!pkg) {
      Alert.alert(
        "Pro is almost ready",
        "Subscriptions aren't fully configured yet. Add a RevenueCat offering with a 'pro_features' entitlement to enable purchasing.",
      );
      return;
    }
    try {
      setPurchasing(true);
      await purchasePackage(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Purchase couldn't be completed.";
      // RevenueCat throws when the user cancels — keep that quiet.
      const isCancel =
        /cancel/i.test(message) || (err as { userCancelled?: boolean })?.userCancelled;
      if (!isCancel) Alert.alert("Purchase failed", message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    Haptics.selectionAsync();
    try {
      setRestoring(true);
      const ok = await restorePurchases();
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Welcome back", "Your Pro access has been restored.");
        router.back();
      } else {
        Alert.alert("Nothing to restore", "We couldn't find an active Pro subscription on this account.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Restore couldn't complete.";
      Alert.alert("Restore failed", message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, presentation: "modal" }} />

      <LinearGradient
        colors={["#000000", "#1A1A1A", "#0a0a0a"]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Subtle gold radial glow */}
      <View style={styles.glow} pointerEvents="none">
        <LinearGradient
          colors={["rgba(212,175,55,0.22)", "rgba(212,175,55,0)"]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <Pressable
        onPress={() => router.back()}
        hitSlop={14}
        style={[styles.close, { top: Math.max(insets.top, 16) + 4 }]}
      >
        <X size={20} color="rgba(255,255,255,0.85)" strokeWidth={2} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 16) + 56,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450 }}
          style={styles.crownBubble}
        >
          <Crown size={26} color={theme.colors.accent} strokeWidth={1.8} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450, delay: 80 }}
        >
          <Text style={styles.eyebrow}>InteriorAI · Pro</Text>
          <Text style={styles.title}>Design without limits.</Text>
          <Text style={styles.subtitle}>
            Unlock every style, every render, in stunning resolution.
          </Text>
        </MotiView>

        <View style={styles.benefitList}>
          {BENEFITS.map((b, idx) => {
            const Icon = b.icon;
            return (
              <MotiView
                key={b.title}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 400,
                  delay: 160 + idx * 90,
                }}
                style={styles.benefitRow}
              >
                <View style={styles.benefitIcon}>
                  <Icon size={18} color={theme.colors.accent} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>{b.title}</Text>
                  <Text style={styles.benefitDesc}>{b.desc}</Text>
                </View>
                <Check
                  size={18}
                  color="rgba(255,255,255,0.55)"
                  strokeWidth={2.2}
                />
              </MotiView>
            );
          })}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 480 }}
          style={styles.ctaBlock}
        >
          <Pressable
            onPress={handlePurchase}
            disabled={purchasing || loading}
            style={({ pressed }) => [
              styles.cta,
              (purchasing || loading) && { opacity: 0.7 },
              pressed && { opacity: 0.9 },
            ]}
          >
            {purchasing || loading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
                <Text style={styles.ctaTitle}>Unlock Pro</Text>
                <Text style={styles.ctaPrice}>
                  {priceLabel}
                  <Text style={styles.ctaPeriod}>{periodLabel}</Text>
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.fineprint}>
            Cancel anytime. Subscription auto-renews until cancelled.
          </Text>

          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            hitSlop={10}
            style={({ pressed }) => [
              styles.restore,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.restoreLabel}>
              {restoring ? "Restoring…" : "Restore Purchases"}
            </Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  glow: {
    position: "absolute",
    top: -120,
    left: -80,
    right: -80,
    height: 380,
    borderBottomLeftRadius: 400,
    borderBottomRightRadius: 400,
    overflow: "hidden",
  },
  close: {
    position: "absolute",
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    zIndex: 5,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  crownBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.4)",
    marginTop: theme.spacing.sm,
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: theme.colors.accent,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    letterSpacing: -0.6,
    color: "#FFFFFF",
    lineHeight: 38,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.7)",
  },

  benefitList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.32)",
  },
  benefitTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  benefitDesc: {
    marginTop: 3,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.6)",
  },

  ctaBlock: { gap: theme.spacing.md, marginTop: theme.spacing.sm },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  ctaTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: theme.colors.primary,
    letterSpacing: 0.2,
  },
  ctaPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: theme.colors.primary,
  },
  ctaPeriod: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(26,26,26,0.7)",
  },
  fineprint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  restore: { alignSelf: "center", paddingVertical: 6 },
  restoreLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textDecorationLine: "underline",
  },
});
