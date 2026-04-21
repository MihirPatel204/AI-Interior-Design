import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Camera, Home, User } from "lucide-react-native";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from "react-native";

import { theme } from "@/constants/theme";

const TAB_BAR_HEIGHT = 68;
const TAB_BAR_MARGIN = 16;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarShowLabel: false,
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.secondary },
        tabBarStyle: {
          position: "absolute",
          left: TAB_BAR_MARGIN,
          right: TAB_BAR_MARGIN,
          bottom: Platform.OS === "ios" ? 28 : 18,
          height: TAB_BAR_HEIGHT,
          borderRadius: 28,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={Platform.OS === "ios" ? 60 : 90}
              tint="light"
              style={[StyleSheet.absoluteFill, styles.blur]}
            />
            <View style={[StyleSheet.absoluteFill, styles.blurFallback]} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: () => (
            <View style={styles.cameraButton}>
              <Camera size={24} color={theme.colors.accent} strokeWidth={2.2} />
            </View>
          ),
          tabBarButton: (props) => (
            <Pressable
              accessibilityRole="button"
              onPress={(e: GestureResponderEvent) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                props.onPress?.(e);
              }}
              style={styles.cameraButtonWrap}
            >
              {props.children}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  Icon,
  focused,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Icon
        size={22}
        color={focused ? theme.colors.primary : theme.colors.mutedForeground}
        strokeWidth={focused ? 2.2 : 1.9}
      />
      {focused ? <View style={styles.activeDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: 28,
    overflow: "hidden",
  },
  blurFallback: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_HEIGHT,
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  cameraButtonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    marginTop: -22,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
