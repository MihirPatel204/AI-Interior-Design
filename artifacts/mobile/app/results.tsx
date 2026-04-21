import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  Lightbulb,
  Move,
  Palette,
  Sofa,
  Sparkles,
} from "lucide-react-native";
import { MotiView } from "moti";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";

interface Section {
  title: string;
  body: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

function parseAnalysis(raw: string): Section[] {
  const text = raw.trim();
  if (!text) return [];

  // Split on numbered headings (1. / 2. / 3.) — Gemini's prompt asks for that.
  const parts = text
    .split(/(?:^|\n)\s*(\d+)[.)]\s+/)
    .filter((p) => p && p.trim().length > 0);

  // After splitting we get an interleaved [num, content, num, content...]
  const blocks: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p && /^\d+$/.test(p) && i + 1 < parts.length) {
      const next = parts[i + 1];
      if (next) blocks.push(next.trim());
      i++;
    } else if (p && !/^\d+$/.test(p)) {
      blocks.push(p.trim());
    }
  }

  const sections: Section[] = [];
  const titles = ["Current furniture", "Design style", "Rearrangement tips"];
  const icons = [Sofa, Palette, Move];
  blocks.forEach((b, idx) => {
    if (idx < 3) {
      const Icon = icons[idx] ?? Lightbulb;
      sections.push({
        title: titles[idx] ?? `Insight ${idx + 1}`,
        body: b,
        icon: Icon,
      });
    }
  });

  // Fallback if parsing didn't split cleanly: one card with the whole text.
  if (sections.length === 0) {
    sections.push({ title: "Designer's notes", body: text, icon: Sparkles });
  }
  return sections;
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ result?: string; imageUri?: string }>();
  const raw = typeof params.result === "string" ? params.result : "";
  const imageUri = typeof params.imageUri === "string" ? params.imageUri : undefined;

  const sections = useMemo(() => parseAnalysis(raw), [raw]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          blurRadius={30}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFillObject, styles.overlay]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Your redesign</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450 }}
        >
          <Text style={styles.eyebrow}>Gemini · Interior Designer</Text>
          <Text style={styles.title}>A new direction for your space.</Text>
        </MotiView>

        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <MotiView
              key={`${section.title}-${idx}`}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 400,
                delay: 100 + idx * 90,
              }}
              style={styles.cardWrap}
            >
              <BlurView intensity={40} tint="dark" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBubble}>
                    <Icon size={18} color={theme.colors.accent} strokeWidth={2} />
                  </View>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                </View>
                <Text style={styles.cardBody}>{section.body}</Text>
              </BlurView>
            </MotiView>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  overlay: {
    backgroundColor: "rgba(10,10,10,0.72)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: theme.colors.accent,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.4,
    color: "#FFFFFF",
    marginBottom: theme.spacing.lg,
  },
  cardWrap: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
  },
  card: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: "rgba(20,20,20,0.35)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.35)",
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  cardBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.86)",
  },
});
