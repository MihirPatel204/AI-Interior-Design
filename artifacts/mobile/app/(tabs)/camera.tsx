import { BlurView } from "expo-blur";
import {
  CameraView,
  useCameraPermissions,
  type CameraType,
  type FlashMode,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { MotiView } from "moti";
import {
  Camera as CameraIcon,
  RotateCcw,
  SwitchCamera,
  X,
  Zap,
  ZapOff,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";
import { analyzeRoomWithGemini, MissingApiKeyError } from "@/services/aiService";

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleAnalyze = async () => {
    if (!photoUri || isAnalyzing) return;
    try {
      setIsAnalyzing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const analysis = await analyzeRoomWithGemini(photoUri);
      setIsAnalyzing(false);
      setPhotoUri(null);
      router.push({
        pathname: "/results",
        params: { result: analysis.raw, imageUri: photoUri },
      });
    } catch (err) {
      setIsAnalyzing(false);
      const message =
        err instanceof MissingApiKeyError
          ? err.message
          : err instanceof Error
            ? `We couldn't reach Gemini. ${err.message}`
            : "Something went wrong while analyzing your room.";
      Alert.alert("Analysis failed", message);
    }
  };

  const topPad = Math.max(insets.top, 16);
  const bottomPad = Math.max(insets.bottom, 24);

  // Permission still loading
  if (!permission) {
    return <View style={styles.root} />;
  }

  // Permission denied / not asked yet
  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.permissionRoot]}>
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.permissionContent}
        >
          <View style={styles.permissionIcon}>
            <CameraIcon
              size={28}
              color={theme.colors.primary}
              strokeWidth={1.75}
            />
          </View>
          <Text style={styles.permissionTitle}>Camera access</Text>
          <Text style={styles.permissionSubtitle}>
            InteriorAI needs your camera to capture rooms and reimagine them.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.permissionButtonLabel}>Grant access</Text>
          </Pressable>
        </MotiView>
      </View>
    );
  }

  // Web fallback — expo-camera has limited web support
  if (Platform.OS === "web") {
    return (
      <View style={[styles.root, styles.permissionRoot]}>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <CameraIcon
              size={28}
              color={theme.colors.primary}
              strokeWidth={1.75}
            />
          </View>
          <Text style={styles.permissionTitle}>Open on a device</Text>
          <Text style={styles.permissionSubtitle}>
            Camera capture is best experienced on iOS or Android. Scan the QR
            code in Expo Go to try it.
          </Text>
        </View>
      </View>
    );
  }

  // Preview mode — show the captured photo with Retake / Analyze
  if (photoUri) {
    return (
      <View style={styles.root}>
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />

        <BlurView
          intensity={40}
          tint="dark"
          style={[styles.topBar, { paddingTop: topPad }]}
        >
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setPhotoUri(null);
            }}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={12}
          >
            <X size={20} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </BlurView>

        <BlurView
          intensity={50}
          tint="dark"
          style={[styles.previewBar, { paddingBottom: bottomPad }]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPhotoUri(null);
            }}
            style={({ pressed }) => [
              styles.previewActionGhost,
              pressed && { opacity: 0.8 },
            ]}
          >
            <RotateCcw size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.previewActionGhostLabel}>Retake</Text>
          </Pressable>

          <Pressable
            onPress={handleAnalyze}
            disabled={isAnalyzing}
            style={({ pressed }) => [
              styles.previewActionPrimary,
              pressed && { opacity: 0.9 },
              isAnalyzing && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.previewActionPrimaryLabel}>Analyze Room</Text>
          </Pressable>
        </BlurView>

        {isAnalyzing ? (
          <View style={styles.loadingOverlay}>
            <BlurView
              intensity={60}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.loadingCard}
            >
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={styles.loadingText}>
                Gemini is redesigning your space…
              </Text>
            </MotiView>
          </View>
        ) : null}
      </View>
    );
  }

  // Live camera mode
  const toggleFacing = () => {
    Haptics.selectionAsync();
    setFacing((f) => (f === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    Haptics.selectionAsync();
    setFlash((f) => (f === "off" ? "on" : "off"));
  };

  const capture = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (photo?.uri) setPhotoUri(photo.uri);
    } catch (err) {
      Alert.alert(
        "Capture failed",
        err instanceof Error ? err.message : "Unable to take photo.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash}
      />

      {/* Top control bar */}
      <BlurView
        intensity={30}
        tint="dark"
        style={[styles.topBar, { paddingTop: topPad }]}
      >
        <Pressable
          onPress={toggleFlash}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={12}
        >
          {flash === "on" ? (
            <Zap
              size={20}
              color={theme.colors.accent}
              strokeWidth={2}
              fill={theme.colors.accent}
            />
          ) : (
            <ZapOff size={20} color="#FFFFFF" strokeWidth={2} />
          )}
        </Pressable>
      </BlurView>

      {/* Bottom control bar */}
      <BlurView
        intensity={30}
        tint="dark"
        style={[styles.bottomBar, { paddingBottom: bottomPad }]}
      >
        <View style={styles.bottomRow}>
          <View style={styles.sideSlot} />

          <Pressable
            onPress={capture}
            disabled={isCapturing}
            style={({ pressed }) => [
              styles.shutterOuter,
              pressed && { transform: [{ scale: 0.95 }] },
              isCapturing && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <View style={styles.sideSlot}>
            <Pressable
              onPress={toggleFacing}
              style={({ pressed }) => [
                styles.iconButtonLarge,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={12}
            >
              <SwitchCamera size={22} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // Permission view
  permissionRoot: {
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  permissionContent: {
    alignItems: "center",
    gap: theme.spacing.md,
    maxWidth: 320,
  },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  permissionTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  permissionSubtitle: {
    ...theme.typography.body,
    color: theme.colors.mutedForeground,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
  },
  permissionButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: theme.colors.primaryForeground,
    letterSpacing: 0.2,
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  iconButtonLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  // Bottom bar (live)
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    overflow: "hidden",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sideSlot: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
  },

  // Preview action bar
  previewBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    overflow: "hidden",
  },
  previewActionGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  previewActionGhostLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  previewActionPrimary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  previewActionPrimaryLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: theme.colors.primary,
    letterSpacing: 0.2,
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  loadingCard: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(20,20,20,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
