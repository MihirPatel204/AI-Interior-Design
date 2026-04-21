import { Camera as CameraIcon } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { theme } from "@/constants/theme";

export default function CameraScreen() {
  return (
    <ScreenContainer withTopInset>
      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.iconWrap}
        >
          <CameraIcon
            size={32}
            color={theme.colors.primary}
            strokeWidth={1.75}
          />
        </MotiView>
        <Text style={styles.title}>Capture a room</Text>
        <Text style={styles.subtitle}>
          The camera will open here. Frame the space you want to redesign.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.mutedForeground,
    textAlign: "center",
    maxWidth: 280,
  },
});
