import { ChevronRight, Settings, Sparkles, User } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProBadge } from "@/components/ProBadge";
import { ScreenContainer } from "@/components/ScreenContainer";
import { theme } from "@/constants/theme";

const rows = [
  { key: "upgrade", icon: Sparkles, label: "Upgrade to Pro", pro: true },
  { key: "account", icon: User, label: "Account" },
  { key: "settings", icon: Settings, label: "Settings" },
];

export default function ProfileScreen() {
  return (
    <ScreenContainer withTopInset>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.card}
        >
          {rows.map((row, idx) => {
            const Icon = row.icon;
            return (
              <View
                key={row.key}
                style={[
                  styles.row,
                  idx < rows.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.rowLeft}>
                  <Icon
                    size={20}
                    color={theme.colors.primary}
                    strokeWidth={1.75}
                  />
                  <Text style={styles.rowLabel}>{row.label}</Text>
                </View>
                <View style={styles.rowRight}>
                  {row.pro ? <ProBadge /> : null}
                  <ChevronRight
                    size={18}
                    color={theme.colors.mutedForeground}
                  />
                </View>
              </View>
            );
          })}
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
    gap: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  rowLabel: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
});
