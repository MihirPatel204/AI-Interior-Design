import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { theme } from "@/constants/theme";

interface Props {
  beforeUri: string;
  afterUri: string;
  /** Optional fixed aspect ratio for the slider container. Defaults to 4:3. */
  aspectRatio?: number;
  /** Initial reveal position [0..1]. Defaults to 0.5. */
  initialPosition?: number;
}

/**
 * Drag the vertical handle left/right to wipe between the original photo
 * (left side) and the AI-generated redesign (right side).
 */
export function ComparisonSlider({
  beforeUri,
  afterUri,
  aspectRatio = 4 / 3,
  initialPosition = 0.5,
}: Props) {
  const [width, setWidth] = useState(0);

  // Slider X in pixels.
  const x = useSharedValue(0);
  // Where the gesture started — needed because Pan deltas are absolute.
  const start = useSharedValue(0);

  // Initialize x once we know the container width.
  React.useEffect(() => {
    if (width > 0 && x.value === 0) {
      x.value = width * initialPosition;
    }
  }, [width, initialPosition, x]);

  const tap = () => {
    Haptics.selectionAsync();
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      start.value = x.value;
      runOnJS(tap)();
    })
    .onUpdate((e) => {
      const next = start.value + e.translationX;
      x.value = Math.max(0, Math.min(width, next));
    })
    .onEnd(() => {
      // Subtle settle if user flicked past the edges.
      x.value = withSpring(x.value, { damping: 24, stiffness: 220 });
    });

  const afterStyle = useAnimatedStyle(() => ({
    width: x.value,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - HANDLE_HALF }],
  }));

  return (
    <View
      style={[styles.container, { aspectRatio }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {/* Base layer: BEFORE */}
      <Image
        source={{ uri: beforeUri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
      />

      {/* Top layer: AFTER, clipped from the left up to the slider X */}
      <Animated.View style={[styles.afterClip, afterStyle]}>
        <Image
          source={{ uri: afterUri }}
          style={[StyleSheet.absoluteFillObject, { width: width || "100%" }]}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Labels */}
      <View pointerEvents="none" style={[styles.label, styles.labelLeft]}>
        <View style={styles.labelPill}>
          <Animated.Text style={styles.labelText}>BEFORE</Animated.Text>
        </View>
      </View>
      <View pointerEvents="none" style={[styles.label, styles.labelRight]}>
        <View style={[styles.labelPill, styles.labelPillAccent]}>
          <Animated.Text
            style={[styles.labelText, styles.labelTextAccent]}
          >
            AFTER
          </Animated.Text>
        </View>
      </View>

      {/* Gesture surface + handle */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.handleWrap, handleStyle]}>
          <View style={styles.handleLine} />
          <View style={styles.handleKnob}>
            <View style={styles.handleArrow} />
            <View style={[styles.handleArrow, styles.handleArrowRight]} />
          </View>
          <View style={styles.handleLine} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const HANDLE_WIDTH = 56;
const HANDLE_HALF = HANDLE_WIDTH / 2;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
  },
  afterClip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },

  label: {
    position: "absolute",
    top: 12,
  },
  labelLeft: { left: 12 },
  labelRight: { right: 12 },
  labelPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  labelPillAccent: { backgroundColor: theme.colors.accent },
  labelText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 1.4,
  },
  labelTextAccent: { color: theme.colors.primary },

  handleWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HANDLE_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  handleLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.95,
  },
  handleKnob: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginVertical: 4,
  },
  handleArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: theme.colors.primary,
  },
  handleArrowRight: {
    borderRightWidth: 0,
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
  },
});
