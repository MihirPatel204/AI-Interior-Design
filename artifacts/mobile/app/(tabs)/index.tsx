import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ArrowRight,
  Camera as CameraIcon,
  Crown,
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react-native";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
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
  SUBSCRIPTION_CONSTANTS,
} from "@/services/subscriptionService";

interface StyleCard {
  id: string;
  title: string;
  blurb: string;
  colors: [string, string];
}

const STYLE_CARDS: StyleCard[] = [
  { id: "Japandi", title: "Japandi", blurb: "Calm · Wood · Linen", colors: ["#3a3631", "#1a1a1a"] },
  { id: "Industrial", title: "Industrial", blurb: "Steel · Brick · Edison", colors: ["#2b2b2e", "#0e0e10"] },
  { id: "Boho", title: "Boho", blurb: "Rattan · Warm · Eclectic", colors: ["#5a3a25", "#231510"] },
  { id: "Scandi", title: "Scandinavian", blurb: "Bright · Airy · Soft", colors: ["#4a5660", "#1a2129"] },
  { id: "Mid-Century", title: "Mid-Century", blurb: "Walnut · Brass · Geometric", colors: ["#6b4a2a", "#2a1c10"] },
];

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: CameraIcon,
    title: "Capture your room",
    body: "Snap a photo from a wide angle so the AI sees the full space.",
  },
  {
    icon: Sparkles,
    title: "Pick a direction",
    body: "Choose a style — Japandi, Boho, Industrial, or anything in between.",
  },
  {
    icon: Wand2,
    title: "See it transformed",
    body: "Gemini reimagines the furniture and decor while keeping your walls.",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [pro, setPro] = useState(false);
  const [usedFree, setUsedFree] = useState(0);

  useEffect(() => {
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
  }, []);

  const remaining = Math.max(
    SUBSCRIPTION_CONSTANTS.FREE_RENDER_LIMIT - usedFree,
    0,
  );

  const goCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/camera");
  };

  const goPaywall = () => {
    Haptics.selectionAsync();
    router.push("/paywall");
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <LinearGradient
            colors={["#0a0a0a", "#1A1A1A"]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* subtle gold corner glow */}
          <LinearGradient
            colors={["rgba(212,175,55,0.18)", "rgba(212,175,55,0)"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.2, y: 0.8 }}
            style={StyleSheet.absoluteFillObject}
          />

          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450 }}
          >
            <View style={styles.heroTopRow}>
              <Text style={styles.brand}>InteriorAI</Text>
              {pro ? (
                <View style={styles.proPill}>
                  <Crown size={11} color={theme.colors.primary} strokeWidth={2.2} />
                  <Text style={styles.proPillText}>PRO</Text>
                </View>
              ) : (
                <Text style={styles.heroDate}>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              )}
            </View>

            <Text style={styles.heroTitle}>Reimagine{"\n"}your space.</Text>
            <Text style={styles.heroSubtitle}>
              Capture a room, pick a direction, and let Gemini compose a new
              interior in seconds.
            </Text>

            <Pressable
              onPress={goCamera}
              style={({ pressed }) => [
                styles.heroCta,
                pressed && { opacity: 0.92 },
              ]}
            >
              <CameraIcon
                size={18}
                color={theme.colors.primary}
                strokeWidth={2.2}
              />
              <Text style={styles.heroCtaLabel}>Start a Redesign</Text>
              <ArrowRight
                size={18}
                color={theme.colors.primary}
                strokeWidth={2.2}
              />
            </Pressable>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaDot} />
              <Text style={styles.heroMeta}>
                {pro
                  ? "Unlimited renders · Pro"
                  : remaining > 0
                    ? `${remaining} free render available`
                    : "Free render used · Upgrade for unlimited"}
              </Text>
            </View>
          </MotiView>
        </View>

        {/* Styles section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Curated</Text>
              <Text style={styles.sectionTitle}>Discover styles</Text>
            </View>
            <Pressable
              onPress={goCamera}
              hitSlop={8}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.sectionLink}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stylesRow}
            decelerationRate="fast"
            snapToInterval={172}
          >
            {STYLE_CARDS.map((s, idx) => (
              <MotiView
                key={s.id}
                from={{ opacity: 0, translateY: 14 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 400,
                  delay: 80 + idx * 60,
                }}
              >
                <Pressable
                  onPress={goCamera}
                  style={({ pressed }) => [
                    styles.styleCard,
                    pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <LinearGradient
                    colors={s.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.styleCardGlow} />
                  <View style={styles.styleCardContent}>
                    <Text style={styles.styleCardBlurb}>{s.blurb}</Text>
                    <Text style={styles.styleCardTitle}>{s.title}</Text>
                  </View>
                </Pressable>
              </MotiView>
            ))}
          </ScrollView>
        </View>

        {/* Pro upsell — only when not Pro */}
        {!pro ? (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450, delay: 200 }}
            style={styles.section}
          >
            <Pressable
              onPress={goPaywall}
              style={({ pressed }) => [
                styles.upsellCard,
                pressed && { opacity: 0.95 },
              ]}
            >
              <LinearGradient
                colors={["#1A1A1A", "#0a0a0a"]}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={["rgba(212,175,55,0.28)", "rgba(212,175,55,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.upsellInner}>
                <View style={styles.upsellCrown}>
                  <Crown
                    size={20}
                    color={theme.colors.accent}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upsellEyebrow}>InteriorAI Pro</Text>
                  <Text style={styles.upsellTitle}>
                    Unlimited renders, 4K exports
                  </Text>
                </View>
                <ArrowRight
                  size={18}
                  color="rgba(255,255,255,0.85)"
                  strokeWidth={2}
                />
              </View>
            </Pressable>
          </MotiView>
        ) : null}

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>The flow</Text>
          <Text style={styles.sectionTitle}>How it works</Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <MotiView
                  key={s.title}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 380,
                    delay: 120 + idx * 80,
                  }}
                  style={styles.stepRow}
                >
                  <View style={styles.stepNumberWrap}>
                    <Text style={styles.stepNumber}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stepIcon}>
                    <Icon
                      size={18}
                      color={theme.colors.primary}
                      strokeWidth={1.8}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepBody}>{s.body}</Text>
                  </View>
                </MotiView>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.secondary },

  // ---- Hero
  hero: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + 8,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  brand: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  heroDate: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  proPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  proPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
    color: theme.colors.primary,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: "#FFFFFF",
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.68)",
    marginBottom: theme.spacing.lg + 4,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroCtaLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 0.2,
    color: theme.colors.primary,
  },
  heroMetaRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroMetaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  heroMeta: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.4,
  },

  // ---- Section primitives
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: theme.spacing.md,
  },
  sectionEyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: theme.colors.mutedForeground,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.3,
    color: theme.colors.primary,
  },
  sectionLink: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: theme.colors.primary,
    opacity: 0.7,
  },

  // ---- Style cards
  stylesRow: {
    paddingRight: theme.spacing.lg,
    gap: 12,
  },
  styleCard: {
    width: 160,
    height: 200,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#1A1A1A",
  },
  styleCardGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  styleCardContent: {
    padding: theme.spacing.md,
  },
  styleCardBlurb: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  styleCardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    letterSpacing: -0.2,
    color: "#FFFFFF",
  },

  // ---- Pro upsell
  upsellCard: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.4)",
  },
  upsellInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 16,
  },
  upsellCrown: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.4)",
  },
  upsellEyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: theme.colors.accent,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  upsellTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },

  // ---- Steps
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  stepNumberWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  stepNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.muted,
  },
  stepTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: theme.colors.primary,
  },
  stepBody: {
    marginTop: 2,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.mutedForeground,
  },
});
