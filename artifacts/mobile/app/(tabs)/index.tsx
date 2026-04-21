import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProBadge } from "@/components/ProBadge";
import { ScreenContainer } from "@/components/ScreenContainer";
import { theme } from "@/constants/theme";

export default function HomeScreen() {
  return (
    <ScreenContainer withTopInset>
      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450 }}
        >
          <Text style={styles.eyebrow}>InteriorAI</Text>
          <Text style={styles.title}>Reimagine your space.</Text>
          <Text style={styles.subtitle}>
            Capture a room, choose a direction, and let the studio compose a new
            interior in seconds.
          </Text>
          <View style={styles.badgeRow}>
            <ProBadge />
            <Text style={styles.badgeHint}>Unlimited renders</Text>
          </View>
        </MotiView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.mutedForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.mutedForeground,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  badgeHint: {
    ...theme.typography.caption,
    color: theme.colors.mutedForeground,
  },
});
