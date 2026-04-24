import { BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, router } from "expo-router";
import {
  ArrowLeft,
  Check,
  Download,
  Lightbulb,
  Move,
  Palette,
  Sofa,
  Sparkles,
  Wand2,
} from "lucide-react-native";
import { AnimatePresence, MotiView } from "moti";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ComparisonSlider } from "@/components/ComparisonSlider";
import { FURNITURE_THEMES } from "@/constants/styles";
import { theme } from "@/constants/theme";
import {
  generateRedesign,
  imageUriToBase64,
  MissingApiKeyError,
  NoImageReturnedError,
  SafetyBlockError,
} from "@/services/renderService";
import {
  hasFreeRenderRemaining,
  incrementFreeRenderCount,
  isUserPro,
} from "@/services/subscriptionService";

interface Section {
  title: string;
  body: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const RESULTS_STYLES = FURNITURE_THEMES.filter((t) => !t.proOnly);

function parseAnalysis(raw: string): Section[] {
  const text = raw.trim();
  if (!text) return [];
  const parts = text
    .split(/(?:^|\n)\s*(\d+)[.)]\s+/)
    .filter((p) => p && p.trim().length > 0);

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

  const [selectedStyle, setSelectedStyle] = useState<string>(
    RESULTS_STYLES[0]!.name,
  );
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ uri: string; mimeType: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!imageUri || generating) return;

    // Pro / free-tier gate.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const pro = await isUserPro();
    if (!pro) {
      const allowed = await hasFreeRenderRemaining();
      if (!allowed) {
        router.push("/paywall");
        return;
      }
    }

    try {
      setGenerating(true);
      setGenerated(null);
      setSaved(false);

      const { base64, mimeType } = await imageUriToBase64(imageUri);
      const result = await generateRedesign(base64, selectedStyle, mimeType);

      setGenerated({
        uri: `data:${result.mimeType};base64,${result.base64}`,
        mimeType: result.mimeType,
      });
      if (!pro) {
        await incrementFreeRenderCount();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let message =
        "Something went wrong while generating your redesign. Please try again.";
      if (err instanceof SafetyBlockError) message = err.message;
      else if (err instanceof MissingApiKeyError) message = err.message;
      else if (err instanceof NoImageReturnedError) message = err.message;
      else if (err instanceof Error)
        message = `We couldn't reach Gemini. ${err.message}`;
      Alert.alert("Redesign failed", message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated || saving) return;
    try {
      setSaving(true);
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow photo library access to save your redesign.",
        );
        return;
      }

      const ext = generated.mimeType.includes("png") ? "png" : "jpg";
      const filePath = `${FileSystem.cacheDirectory}interiorai-${Date.now()}.${ext}`;
      const base64 = generated.uri.split(",")[1] ?? "";
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(filePath);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message =
        err instanceof Error ? err.message : "Couldn't save the image.";
      Alert.alert("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

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

        {/* Magic Redesign block */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450, delay: 350 }}
          style={{ marginTop: theme.spacing.lg }}
        >
          <Text style={styles.sectionLabel}>Magic Redesign</Text>
          <Text style={styles.sectionHint}>
            Pick a style. Gemini will reimagine your room while keeping the
            walls and windows intact.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.styleRow}
          >
            {RESULTS_STYLES.map((s) => {
              const active = selectedStyle === s.name;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedStyle(s.name);
                  }}
                  style={({ pressed }) => [
                    styles.styleThumb,
                    active && styles.styleThumbActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Image
                    source={s.hero}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.styleThumbScrim} />
                  <Text style={styles.styleThumbLabel} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {active ? (
                    <View style={styles.styleThumbCheck}>
                      <Check size={12} color={theme.colors.primary} strokeWidth={2.6} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={handleGenerate}
            disabled={generating || !imageUri}
            style={({ pressed }) => [
              styles.generateButton,
              (generating || !imageUri) && { opacity: 0.6 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Wand2 size={18} color={theme.colors.primary} strokeWidth={2.2} />
            <Text style={styles.generateButtonLabel}>
              {generating ? "Reimagining…" : "Generate Visual"}
            </Text>
          </Pressable>
        </MotiView>

        {/* Preview / generated image area */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450, delay: 450 }}
          style={styles.previewWrap}
        >
          {imageUri ? (
            generated ? (
              <View>
                <ComparisonSlider
                  beforeUri={imageUri}
                  afterUri={generated.uri}
                  aspectRatio={4 / 3}
                />
                <Text style={styles.dragHint}>
                  Drag the handle to compare
                </Text>
              </View>
            ) : (
              <View style={styles.previewBox}>
                <Image
                  source={{ uri: imageUri }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  transition={200}
                />
                <AnimatePresence>
                  {generating ? (
                    <MotiView
                      key="gen-overlay"
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "timing", duration: 250 }}
                      style={StyleSheet.absoluteFillObject}
                    >
                      <BlurView
                        intensity={50}
                        tint="dark"
                        style={StyleSheet.absoluteFillObject}
                      />
                      <MotiView
                        from={{ translateX: -260, opacity: 0.0 }}
                        animate={{ translateX: 260, opacity: 0.55 }}
                        transition={{
                          loop: true,
                          type: "timing",
                          duration: 1400,
                        }}
                        style={styles.shimmerBar}
                      />
                      <View style={styles.generatingCenter}>
                        <ActivityIndicator
                          size="large"
                          color={theme.colors.accent}
                        />
                        <Text style={styles.generatingText}>
                          Crafting your {selectedStyle} redesign…
                        </Text>
                      </View>
                    </MotiView>
                  ) : null}
                </AnimatePresence>
              </View>
            )
          ) : null}

          {/* Save Design */}
          {generated ? (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveButton,
                saved && styles.saveButtonSaved,
                (saving || saved) && { opacity: 0.85 },
                pressed && { opacity: 0.85 },
              ]}
            >
              {saved ? (
                <Check size={18} color="#FFFFFF" strokeWidth={2.2} />
              ) : (
                <Download size={18} color="#FFFFFF" strokeWidth={2.2} />
              )}
              <Text style={styles.saveButtonLabel}>
                {saved ? "Saved to Photos" : saving ? "Saving…" : "Save Design"}
              </Text>
            </Pressable>
          ) : null}
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  overlay: { backgroundColor: "rgba(10,10,10,0.72)" },

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

  // Magic Redesign block
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  sectionHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.65)",
    marginBottom: theme.spacing.md,
  },
  styleRow: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: theme.spacing.md,
  },
  styleThumb: {
    width: 96,
    height: 124,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#1A1A1A",
    borderWidth: 2,
    borderColor: "transparent",
  },
  styleThumbActive: {
    borderColor: theme.colors.accent,
  },
  styleThumbScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  styleThumbLabel: {
    margin: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  styleThumbCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  generateButton: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  generateButtonLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: theme.colors.primary,
    letterSpacing: 0.2,
  },

  // Preview area
  previewWrap: { marginTop: theme.spacing.lg, gap: theme.spacing.md },
  previewBox: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
  },
  shimmerBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: "rgba(255,255,255,0.18)",
    transform: [{ skewX: "-20deg" }],
  },
  generatingCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  generatingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  dragHint: {
    marginTop: 10,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
  },
  saveButtonSaved: {
    backgroundColor: "rgba(46,160,67,0.55)",
    borderColor: "rgba(46,160,67,0.85)",
  },
  saveButtonLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
