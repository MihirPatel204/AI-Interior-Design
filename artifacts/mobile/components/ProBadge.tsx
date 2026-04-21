import { Sparkles } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";

export function ProBadge() {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 350 }}
      style={styles.badge}
    >
      <Sparkles size={12} color={theme.colors.primary} strokeWidth={2.25} />
      <Text style={styles.text}>PRO</Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
    color: theme.colors.primary,
  },
});
