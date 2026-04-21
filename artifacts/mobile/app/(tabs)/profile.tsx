import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import {
  Bell,
  ChevronRight,
  Crown,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  LifeBuoy,
  Lock,
  RefreshCcw,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";
import {
  getFreeRenderCount,
  isUserPro,
  restorePurchases,
  SUBSCRIPTION_CONSTANTS,
} from "@/services/subscriptionService";

interface Row {
  key: string;
  icon: LucideIcon;
  label: string;
  trailing?: string;
  onPress?: () => void;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [pro, setPro] = useState(false);
  const [usedFree, setUsedFree] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [p, used] = await Promise.all([
          isUserPro().catch(() => false),
          getFreeRenderCount().catch(() => 0),
        ]);
        if (!cancelled) {
          setPro(p);
          setUsedFree(used);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const limit = SUBSCRIPTION_CONSTANTS.FREE_RENDER_LIMIT;
  const remaining = Math.max(limit - usedFree, 0);
  const ratio = pro ? 1 : Math.min(usedFree / limit, 1);

  const goPaywall = () => {
    Haptics.selectionAsync();
    router.push("/paywall");
  };

  const handleRestore = async () => {
    Haptics.selectionAsync();
    const ok = await restorePurchases().catch(() => false);
    if (ok) setPro(true);
  };

  const accountRows: Row[] = [
    { key: "renders", icon: ImageIcon, label: "My renders", trailing: String(usedFree) },
    { key: "notifications", icon: Bell, label: "Notifications" },
    { key: "privacy", icon: Lock, label: "Privacy" },
  ];

  const supportRows: Row[] = [
    { key: "help", icon: HelpCircle, label: "Help center" },
    { key: "contact", icon: LifeBuoy, label: "Contact support" },
    { key: "terms", icon: Shield, label: "Terms & policy" },
    { key: "rate", icon: Heart, label: "Rate InteriorAI" },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.headerRow}
        >
          <View>
            <Text style={styles.eyebrow}>Profile</Text>
            <Text style={styles.title}>Hello, Designer</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>D</Text>
          </View>
        </MotiView>

        {/* Plan card */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450, delay: 80 }}
          style={styles.planCardWrap}
        >
          <Pressable
            disabled={pro}
            onPress={goPaywall}
            style={({ pressed }) => [pressed && { opacity: 0.95 }]}
          >
            <View style={styles.planCard}>
              <LinearGradient
                colors={["#1A1A1A", "#0a0a0a"]}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={["rgba(212,175,55,0.32)", "rgba(212,175,55,0)"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.planTopRow}>
                <View style={styles.planBadge}>
                  {pro ? (
                    <Crown size={12} color={theme.colors.accent} strokeWidth={2} />
                  ) : (
                    <Sparkles size={12} color={theme.colors.accent} strokeWidth={2} />
                  )}
                  <Text style={styles.planBadgeText}>
                    {pro ? "PRO MEMBER" : "FREE PLAN"}
                  </Text>
                </View>
                {!pro ? (
                  <Text style={styles.planUpgradeHint}>Tap to upgrade →</Text>
                ) : null}
              </View>

              <Text style={styles.planTitle}>
                {pro ? "Welcome to Pro" : "Unlock unlimited renders"}
              </Text>
              <Text style={styles.planSubtitle}>
                {pro
                  ? "Unlimited renders · 4K exports · Priority processing"
                  : "Just $9.99/mo for unlimited AI redesigns and 4K exports."}
              </Text>

              {/* Usage meter */}
              <View style={styles.meterRow}>
                <Text style={styles.meterLabel}>
                  {pro
                    ? "Renders this month"
                    : `${remaining} of ${limit} free render${limit === 1 ? "" : "s"} left`}
                </Text>
                <Text style={styles.meterValue}>
                  {pro ? "∞" : `${usedFree}/${limit}`}
                </Text>
              </View>
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${Math.round(ratio * 100)}%`,
                      backgroundColor: pro
                        ? theme.colors.accent
                        : remaining === 0
                          ? "#E5484D"
                          : theme.colors.accent,
                    },
                  ]}
                />
              </View>
            </View>
          </Pressable>
        </MotiView>

        {/* Account section */}
        <SectionHeader label="Account" />
        <Card>
          {accountRows.map((r, idx) => (
            <SettingRow
              key={r.key}
              row={r}
              isLast={idx === accountRows.length - 1}
            />
          ))}
        </Card>

        {/* Support section */}
        <SectionHeader label="Support" />
        <Card>
          {supportRows.map((r, idx) => (
            <SettingRow
              key={r.key}
              row={r}
              isLast={idx === supportRows.length - 1}
            />
          ))}
        </Card>

        {/* Restore */}
        <Pressable
          onPress={handleRestore}
          style={({ pressed }) => [
            styles.restoreRow,
            pressed && { opacity: 0.7 },
          ]}
        >
          <RefreshCcw size={14} color={theme.colors.mutedForeground} strokeWidth={2} />
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        <Text style={styles.versionText}>InteriorAI · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function SettingRow({ row, isLast }: { row: Row; isLast: boolean }) {
  const Icon = row.icon;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        row.onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && { backgroundColor: theme.colors.muted },
      ]}
    >
      <View style={styles.rowIconWrap}>
        <Icon size={17} color={theme.colors.primary} strokeWidth={1.9} />
      </View>
      <Text style={styles.rowLabel}>{row.label}</Text>
      <View style={styles.rowRight}>
        {row.trailing ? (
          <Text style={styles.rowTrailing}>{row.trailing}</Text>
        ) : null}
        <ChevronRight size={18} color={theme.colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.secondary },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: theme.colors.mutedForeground,
    marginBottom: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    color: theme.colors.primary,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },

  // Plan card
  planCardWrap: {
    marginBottom: theme.spacing.lg,
  },
  planCard: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.35)",
  },
  planTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.45)",
  },
  planBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: theme.colors.accent,
    letterSpacing: 1.4,
  },
  planUpgradeHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
  planTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  planSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.65)",
    marginBottom: theme.spacing.md,
  },
  meterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  meterLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  meterValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Sections
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.lg,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    gap: theme.spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.muted,
  },
  rowLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: theme.colors.primary,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTrailing: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: theme.colors.mutedForeground,
  },

  restoreRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing.lg,
    paddingVertical: 12,
  },
  restoreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: theme.colors.mutedForeground,
  },
  versionText: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: theme.colors.mutedForeground,
    letterSpacing: 0.4,
  },
});
