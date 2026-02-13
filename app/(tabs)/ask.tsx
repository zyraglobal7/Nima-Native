import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChatInput } from "@/components/ask/ChatInput";
import {
  MessageBubble,
  TypingIndicator,
  type DisplayMessage,
} from "@/components/ask/MessageBubble";
import { WelcomeHero } from "@/components/ask/WelcomeHero";
import {
  PromptSuggestions,
  PromptChips,
} from "@/components/ask/PromptSuggestions";
import { FittingRoomCard } from "@/components/ask/FittingRoomCard";
import { SearchingCard } from "@/components/ask/SearchingCard";
import { ExploreCard } from "@/components/ask/ExploreCard";
import { Text } from "@/components/ui/Text";
import { ArrowLeft, Sparkles, Clock } from "lucide-react-native";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { CreditsModal } from "@/components/credits/CreditsModal";
import { ChatHistoryDrawer } from "@/components/ask/ChatHistoryDrawer";

type ViewState = "welcome" | "chatting";
type ChatState = "idle" | "typing" | "curating" | "generating" | "no_matches";

export default function AskScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { isDark } = useTheme();

  // View & chat state
  const [viewState, setViewState] = useState<ViewState>("welcome");
  const [chatState, setChatState] = useState<ChatState>("idle");

  // Thread management
  const [threadId, setThreadId] = useState<Id<"threads"> | null>(null);

  // Pending local messages (before DB sync)
  const [pendingMessages, setPendingMessages] = useState<DisplayMessage[]>([]);

  // Chat conversation history for AI context
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  // Look generation state
  const [createdLookIds, setCreatedLookIds] = useState<Id<"looks">[]>([]);
  const [lookScenario, setLookScenario] = useState<"fresh" | "remix">("fresh");
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Get current user
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // Database messages (reactive)
  const dbMessages = useQuery(
    api.messages.queries.getAllMessages,
    threadId ? { threadId } : "skip",
  );

  // Recent looks for remix context
  const userRecentLooks = useQuery(api.chat.queries.getUserRecentLooks, {});

  // Mutations & actions
  const startConversation = useMutation(
    api.messages.mutations.startConversation,
  );
  const saveAssistantMessage = useMutation(
    api.messages.mutations.saveAssistantMessage,
  );
  const createLooksFromChat = useMutation(
    api.chat.mutations.createLooksFromChat,
  );
  const saveFittingReadyMessage = useMutation(
    api.messages.mutations.saveFittingReadyMessage,
  );
  const saveNoMatchesMessage = useMutation(
    api.messages.mutations.saveNoMatchesMessage,
  );
  const scheduleChatLookImages = useMutation(
    api.chat.mutations.scheduleChatLookImageGeneration,
  );
  const sendChatMessage = useAction(api.chat.actions.sendChatMessage);
  const sendUserMessage = useMutation(api.messages.mutations.sendMessage);

  // Build user data for AI context
  const userData = useMemo(() => {
    if (!currentUser) return undefined;
    return {
      gender: currentUser.gender,
      stylePreferences: currentUser.stylePreferences,
      budgetRange: currentUser.budgetRange,
      shirtSize: currentUser.shirtSize,
      waistSize: currentUser.waistSize,
      shoeSize: currentUser.shoeSize,
      shoeSizeUnit: currentUser.shoeSizeUnit,
      country: currentUser.country,
      currency: currentUser.currency,
      firstName: currentUser.firstName,
      age: currentUser.age,
    };
  }, [currentUser]);

  // Combine DB + pending messages into display messages
  const displayMessages = useMemo((): DisplayMessage[] => {
    // Convert DB messages to display format
    const dbDisplayMessages: DisplayMessage[] = (dbMessages || []).map(
      (msg) => ({
        id: msg._id,
        role: msg.role === "assistant" ? "nima" : "user",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        type:
          msg.messageType === "fitting-ready"
            ? "fitting-ready"
            : msg.messageType === "no-matches"
              ? "text"
              : "text",
        sessionId:
          msg.messageType === "fitting-ready" && msg.lookIds
            ? msg.lookIds.join(",")
            : undefined,
        variant: "fresh" as const,
        lookCount: msg.lookIds?.length,
      }),
    );

    // Filter pending messages that already exist in DB
    const dbMessageIds = new Set(
      (dbMessages || []).map((m) => m._id as string),
    );
    const filteredPending = pendingMessages.filter(
      (pm) => !pm.id.startsWith("db-") && !dbMessageIds.has(pm.id),
    );

    return [...dbDisplayMessages, ...filteredPending];
  }, [dbMessages, pendingMessages]);

  // Handle [MATCH_ITEMS:occasion] tag
  const handleMatchItems = useCallback(
    async (occasion: string, currentThreadId: Id<"threads">) => {
      setChatState("curating");

      try {
        // Create looks
        const result = await createLooksFromChat({
          occasion,
          context: occasion,
        });

        if (result.success && "lookIds" in result) {
          const lookIds = result.lookIds;
          setCreatedLookIds(lookIds);
          setLookScenario(result.scenario);

          // Schedule image generation (runs in parallel, no token expiry)
          setChatState("generating");
          await scheduleChatLookImages({ lookIds });

          // Save fitting-ready message
          await saveFittingReadyMessage({
            threadId: currentThreadId,
            lookIds,
            content: `I found ${lookIds.length} look${lookIds.length !== 1 ? "s" : ""} for you!`,
          });

          setChatState("idle");
        } else if (!result.success && result.message === "insufficient_credits") {
          // Show credits modal
          setChatState("idle");
          setShowCreditsModal(true);
        } else {
          // No matches
          await saveNoMatchesMessage({
            threadId: currentThreadId,
            occasion,
            content:
              "I couldn't find items that perfectly match right now, but don't worry! Check out our public looks for inspiration.",
          });
          setChatState("no_matches");
        }
      } catch (error) {
        console.error("Error matching items:", error);
        setChatState("no_matches");
      }
    },
    [
      createLooksFromChat,
      scheduleChatLookImages,
      saveFittingReadyMessage,
      saveNoMatchesMessage,
    ],
  );

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Switch to chatting view
      setViewState("chatting");
      setChatState("typing");

      // Add user message to pending
      const userMsg: DisplayMessage = {
        id: `pending-user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
        type: "text",
      };
      setPendingMessages((prev) => [...prev, userMsg]);

      // Update conversation history
      const newHistory = [
        ...conversationHistory,
        { role: "user" as const, content },
      ];
      setConversationHistory(newHistory);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      try {
        // Start conversation if needed, or save user message to existing thread
        let currentThreadId = threadId;
        if (!currentThreadId) {
          const result = await startConversation({
            content,
            contextType: "outfit_help",
          });
          currentThreadId = result.threadId;
          setThreadId(currentThreadId);
        } else {
          // Thread already exists — persist the user message to DB
          await sendUserMessage({
            threadId: currentThreadId,
            content,
          });
        }

        // Send to AI
        const aiResult = await sendChatMessage({
          messages: newHistory,
          userData,
        });

        if (!aiResult.success || !aiResult.content) {
          // AI error
          const errorMsg: DisplayMessage = {
            id: `error-${Date.now()}`,
            role: "nima",
            content:
              "Sorry, I had trouble processing that. Can you try again? 🙏",
            timestamp: new Date(),
            type: "text",
          };
          setPendingMessages((prev) => [...prev, errorMsg]);
          setChatState("idle");
          return;
        }

        const aiContent = aiResult.content;

        // Update conversation history with AI response
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant" as const, content: aiContent },
        ]);

        // Check for [MATCH_ITEMS:occasion] tag
        const matchItemsRegex = /\[MATCH_ITEMS:([^\]]+)\]/;
        const matchItemsMatch = aiContent.match(matchItemsRegex);

        // Check for [REMIX_LOOK:source|twist] tag
        const remixLookRegex = /\[REMIX_LOOK:([^\]]+)\]/;
        const remixLookMatch = aiContent.match(remixLookRegex);

        // Save assistant message to DB (clean version without tags)
        const cleanContent = aiContent
          .replace(/\[MATCH_ITEMS:[^\]]*\]/g, "")
          .replace(/\[REMIX_LOOK:[^\]]*\]/g, "")
          .trim();

        if (cleanContent) {
          await saveAssistantMessage({
            threadId: currentThreadId,
            content: cleanContent,
          });
        }

        // Clear pending messages (they'll be replaced by DB messages)
        setPendingMessages([]);

        // Handle tags
        if (matchItemsMatch) {
          const occasion = matchItemsMatch[1];
          await handleMatchItems(occasion, currentThreadId);
        } else if (remixLookMatch) {
          // Parse source|twist format
          const parts = remixLookMatch[1].split("|");
          const sourceOccasion = parts[0] || "casual";
          // Remix uses same flow as match for now
          await handleMatchItems(sourceOccasion, currentThreadId);
        } else {
          setChatState("idle");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMsg: DisplayMessage = {
          id: `error-${Date.now()}`,
          role: "nima",
          content: "Something went wrong. Please try again! 🙏",
          timestamp: new Date(),
          type: "text",
        };
        setPendingMessages((prev) => [...prev, errorMsg]);
        setChatState("idle");
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    },
    [
      threadId,
      conversationHistory,
      userData,
      startConversation,
      sendUserMessage,
      sendChatMessage,
      saveAssistantMessage,
      handleMatchItems,
    ],
  );

  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleFittingRoomClick = useCallback(
    (sessionId: string) => {
      router.push(`/fitting/${sessionId}` as any);
    },
    [router],
  );

  const handleExplore = useCallback(() => {
    router.push("/(tabs)/discover" as any);
  }, [router]);

  const handleBackToWelcome = useCallback(() => {
    setViewState("welcome");
    setChatState("idle");
    setThreadId(null);
    setPendingMessages([]);
    setConversationHistory([]);
    setCreatedLookIds([]);
  }, []);

  const handleSelectThread = useCallback((selectedThreadId: Id<"threads">) => {
    setThreadId(selectedThreadId);
    setViewState("chatting");
    setChatState("idle");
    setPendingMessages([]);
    setConversationHistory([]);
    setCreatedLookIds([]);
  }, []);

  const handleNewChat = useCallback(() => {
    setViewState("welcome");
    setChatState("idle");
    setThreadId(null);
    setPendingMessages([]);
    setConversationHistory([]);
    setCreatedLookIds([]);
  }, []);

  // Register global callback so the Header can open chat history
  useEffect(() => {
    (globalThis as any).__openChatHistory = () => setShowChatHistory(true);
    return () => {
      delete (globalThis as any).__openChatHistory;
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (displayMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [displayMessages.length]);

  // Get placeholder text based on state
  const getInputPlaceholder = () => {
    switch (chatState) {
      case "curating":
        return "Curating looks for you...";
      case "generating":
        return "Generating your looks...";
      case "typing":
        return "Nima is thinking...";
      default:
        return "Describe what you're looking for...";
    }
  };

  const isInputDisabled =
    chatState === "typing" ||
    chatState === "curating" ||
    chatState === "generating";

  // =====================================================
  // WELCOME VIEW
  // =====================================================
  if (viewState === "welcome") {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark">
        {/* Animated Background */}
        <View className="absolute inset-0">
          <LinearGradient
            colors={
              isDark
                ? ["rgba(166,124,82,0.08)", "transparent"]
                : ["rgba(201,160,122,0.15)", "transparent"]
            }
            locations={[0, 0.6]}
            style={{ flex: 1 }}
          />
        </View>

        {/* Ambient glow orbs */}
        <Animated.View
          entering={FadeIn.duration(1200)}
          style={{
            position: "absolute",
            top: "20%",
            left: "15%",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: isDark
              ? "rgba(201,160,122,0.06)"
              : "rgba(201,160,122,0.1)",
          }}
        />
        <Animated.View
          entering={FadeIn.duration(1200).delay(300)}
          style={{
            position: "absolute",
            bottom: "25%",
            right: "10%",
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: isDark
              ? "rgba(166,124,82,0.05)"
              : "rgba(166,124,82,0.08)",
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 140 : 0}
        >
          <View className="flex-1 justify-center items-center px-6">
            <WelcomeHero className="mb-10" />
            <PromptSuggestions onSelect={handlePromptSelect} />
          </View>

          {/* Fixed bottom input */}
          <ChatInput
            onSend={handleSendMessage}
            placeholder="Describe what you're looking for..."
          />
        </KeyboardAvoidingView>

        {/* Chat History Drawer */}
        <ChatHistoryDrawer
          visible={showChatHistory}
          onClose={() => setShowChatHistory(false)}
          onSelectThread={handleSelectThread}
          onNewChat={handleNewChat}
          currentThreadId={threadId}
        />
      </View>
    );
  }

  // =====================================================
  // CHATTING VIEW
  // =====================================================

  // Render a single chat item
  const renderChatItem = ({ item }: { item: DisplayMessage }) => {
    // Fitting-ready messages get special card
    if (item.type === "fitting-ready" && item.sessionId) {
      return (
        <FittingRoomCard
          sessionId={item.sessionId}
          lookCount={item.lookCount || 3}
          animate={true}
          onPress={() => handleFittingRoomClick(item.sessionId!)}
          variant={item.variant || lookScenario}
        />
      );
    }

    // Regular messages
    return (
      <MessageBubble
        message={item}
        animate={true}
        onFittingRoomClick={handleFittingRoomClick}
      />
    );
  };

  // Footer: typing indicator, searching card, no-matches
  const renderFooter = () => {
    return (
      <View>
        {/* Typing indicator */}
        {chatState === "typing" && <TypingIndicator />}

        {/* Searching/curating card */}
        {(chatState === "curating" || chatState === "generating") && (
          <SearchingCard animate={true} />
        )}

        {/* No matches */}
        {chatState === "no_matches" && (
          <ExploreCard animate={true} onExplore={handleExplore} />
        )}

        {/* Prompt chips after idle + messages exist */}
        {chatState === "idle" && displayMessages.length > 0 && (
          <PromptChips onSelect={handlePromptSelect} count={2} />
        )}

        {/* Bottom spacer */}
        <View style={{ height: 8 }} />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 140 : 0}
      >
        {/* Chat header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border/20 dark:border-border-dark/20 bg-background/95 dark:bg-background-dark/95">
          <TouchableOpacity
            onPress={handleBackToWelcome}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
          >
            <ArrowLeft size={22} color={isDark ? "#E0D8CC" : "#2D2926"} />
          </TouchableOpacity>

          <View className="w-8 h-8 rounded-full bg-primary dark:bg-primary-dark items-center justify-center mr-2.5">
            <Sparkles size={14} color="#FAF8F5" />
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
              Nima
            </Text>
            <Text className="text-xs text-muted-foreground dark:text-muted-dark-foreground">
              Your AI Stylist
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowChatHistory(true)}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full items-center justify-center"
          >
            <Clock size={20} color={isDark ? "#C4B8A8" : "#6B635B"} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          ListFooterComponent={renderFooter}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isInputDisabled}
          placeholder={getInputPlaceholder()}
          disabledPlaceholder={getInputPlaceholder()}
        />
      </KeyboardAvoidingView>

      {/* Credits Modal */}
      <CreditsModal
        visible={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
      />

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        visible={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
        currentThreadId={threadId}
      />
    </View>
  );
}
