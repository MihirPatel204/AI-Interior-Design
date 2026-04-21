import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withTopInset?: boolean;
}

export function ScreenContainer({
  children,
  style,
  withTopInset = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        withTopInset && { paddingTop: insets.top },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
});
