import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { RefreshCw, SendHorizontal, Sparkles } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FURNITURE_THEMES } from "@/constants/styles";
import { theme } from "@/constants/theme";
import {
  askFurnitureChatbot,
  MissingApiKeyError,
  NetworkRequestError,
  RateLimitedError,
  type ChatRole,
} from "@/services/chatService";

interface UiMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const INITIAL_ASSISTANT_MESSAGE =
  "I am your furniture assistant. Ask me about layouts, style matching, furniture selection, decor, or budget alternatives.";

const INITIAL_MESSAGES: UiMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: INITIAL_ASSISTANT_MESSAGE,
  },
];

const QUICK_PROMPTS = [
  "How should I arrange my sofa and coffee table for better flow?",
  "Recommend budget furniture upgrades for this room.",
  "What lighting setup matches this style best?",
  "Suggest a color palette that works with natural wood furniture.",
];

const COMPOSER_BOTTOM_GAP = 12;
const FLOATING_TAB_BAR_HEIGHT = 68;
const FLOATING_TAB_BAR_BOTTOM = Platform.OS === "ios" ? 28 : 18;
const FLOATING_TAB_BAR_CLEARANCE =
  FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM;

function normalizeStyle(styleParam: string | undefined): string {
  if (!styleParam || styleParam.trim().length === 0) {
    return FURNITURE_THEMES[0]!.name;
  }

  const normalized = styleParam.trim().toLowerCase();
  const match = FURNITURE_THEMES.find(
    (style) =>
      style.id.toLowerCase() === normalized ||
      style.name.toLowerCase() === normalized,
  );

  return match?.name ?? FURNITURE_THEMES[0]!.name;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ analysis?: string; style?: string }>();
  const roomAnalysis =
    typeof params.analysis === "string" && params.analysis.trim().length > 0
      ? params.analysis
      : undefined;

  const initialStyle = useMemo(
    () => normalizeStyle(typeof params.style === "string" ? params.style : undefined),
    [params.style],
  );

  const [selectedStyle, setSelectedStyle] = useState<string>(initialStyle);
  const [messages, setMessages] = useState<UiMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const hasConversation = messages.some((msg) => msg.role === "user");

  const startNewChat = () => {
    if (sending) return;
    Haptics.selectionAsync();
    setInput("");
    setMessages([{ ...INITIAL_MESSAGES[0] }]);
  };

  const sendMessage = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || sending) return;

    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    try {
      setSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await askFurnitureChatbot({
        message: text,
        selectedStyle,
        roomAnalysis,
        history: nextMessages.slice(-12).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (err) {
      let message = "Could not send your message. Please try again.";

      if (err instanceof MissingApiKeyError) {
        message = err.message;
      } else if (err instanceof NetworkRequestError) {
        message = err.message;
      } else if (err instanceof RateLimitedError) {
        const retry = err.retryAfterSec;
        message = retry
          ? `${err.message} Try again in ${retry}s.`
          : err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      Alert.alert("Chat unavailable", message);
    } finally {
      setSending(false);
    }
  };

  const canSend = input.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTitle}>
          <Text style={styles.eyebrow}>InteriorAI</Text>
          <Text style={styles.title}>Furniture Chatbot</Text>
        </View>
        <View style={styles.headerActions}>
          {hasConversation ? (
            <Pressable
              onPress={startNewChat}
              disabled={sending}
              style={({ pressed }) => [
                styles.newChatButton,
                sending && { opacity: 0.5 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <RefreshCw size={13} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.newChatButtonLabel}>New Chat</Text>
            </Pressable>
          ) : null}
          <View style={styles.badge}>
            <Sparkles size={14} color={theme.colors.accent} strokeWidth={2.2} />
            <Text style={styles.badgeText}>AI</Text>
          </View>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Ask layout, style, furniture, and decor questions for practical, room-aware guidance.
      </Text>

      {!hasConversation ? (
        <ScrollView
          horizontal
          style={styles.styleScroller}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.styleRow}
        >
          {FURNITURE_THEMES.map((style) => {
            const active = selectedStyle === style.name;
            return (
              <Pressable
                key={style.id}
                onPress={() => setSelectedStyle(style.name)}
                style={({ pressed }) => [
                  styles.styleChip,
                  active && styles.styleChipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.styleChipText,
                    active && styles.styleChipTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {style.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: theme.spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg) => {
          const user = msg.role === "user";
          return (
            <View
              key={msg.id}
              style={[styles.bubbleRow, user ? styles.userRow : styles.assistantRow]}
            >
              <View
                style={[
                  styles.bubble,
                  user ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    user ? styles.userBubbleText : styles.assistantBubbleText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          );
        })}

        {messages.length <= 1 ? (
          <View style={styles.quickPromptsWrap}>
            <Text style={styles.quickPromptsLabel}>Try asking</Text>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => sendMessage(prompt)}
                disabled={sending}
                style={({ pressed }) => [
                  styles.quickPrompt,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.composerWrap,
          {
            paddingBottom:
              Math.max(insets.bottom, COMPOSER_BOTTOM_GAP) +
              FLOATING_TAB_BAR_CLEARANCE,
          },
        ]}
      >
        <View style={styles.composerRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about furniture layout, decor, or style..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.input}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && { opacity: 0.45 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <SendHorizontal
              size={16}
              color={theme.colors.primary}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>
        <Text style={styles.composerHint}>
          {sending ? "Thinking..." : `Focused style: ${selectedStyle}`}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f1012",
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 8,
  },
  eyebrow: {
    color: theme.colors.accent,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(212,175,55,0.15)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.5)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    color: theme.colors.accent,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  newChatButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newChatButtonLabel: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  styleRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    gap: 8,
    paddingRight: theme.spacing.lg,
    alignItems: "center",
  },
  styleScroller: {
    flexGrow: 0,
    maxHeight: 54,
    marginBottom: theme.spacing.sm,
  },
  styleChip: {
    height: 38,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    maxWidth: 116,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  styleChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(212,175,55,0.2)",
  },
  styleChipText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  styleChipTextActive: {
    color: "#FFFFFF",
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  bubbleRow: {
    width: "100%",
  },
  userRow: {
    alignItems: "flex-end",
  },
  assistantRow: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "90%",
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: {
    backgroundColor: theme.colors.accent,
    borderColor: "rgba(212,175,55,0.8)",
  },
  assistantBubble: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  userBubbleText: {
    color: theme.colors.primary,
  },
  assistantBubbleText: {
    color: "rgba(255,255,255,0.93)",
  },
  quickPromptsWrap: {
    marginTop: 8,
    gap: 8,
  },
  quickPromptsLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginBottom: 2,
  },
  quickPrompt: {
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickPromptText: {
    color: "rgba(255,255,255,0.88)",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  composerWrap: {
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(15,16,18,0.95)",
    gap: 6,
  },
  composerRow: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    color: "#FFFFFF",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  composerHint: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginLeft: 2,
  },
});
