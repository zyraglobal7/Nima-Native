import { useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, Sparkles } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Id } from "@/convex/_generated/dataModel";

type MessageItem = {
  _id: Id<"direct_messages">;
  lookId: Id<"looks">;
  lookPublicId: string;
  lookName?: string;
  lookImageUrl: string | null;
  sentByMe: boolean;
  createdAt: number;
  isRead: boolean;
};

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

export default function MessageDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const otherUserId = userId as Id<"users">;

  const messages = useQuery(
    api.directMessages.queries.getConversationMessages,
    otherUserId ? { otherUserId } : "skip",
  );

  const markAsRead = useMutation(
    api.directMessages.mutations.markConversationAsRead,
  );

  // Mark as read when opening conversation
  useEffect(() => {
    if (otherUserId && messages && messages.some((m) => !m.isRead && !m.sentByMe)) {
      markAsRead({ otherUserId }).catch(() => {
        // Ignore errors
      });
    }
  }, [otherUserId, messages]);

  const isLoading = messages === undefined;

  const handleLookPress = (lookPublicId: string) => {
    router.push(`/look/${lookPublicId}` as any);
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: MessageItem;
    index: number;
  }) => {
    const isMine = item.sentByMe;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40).duration(300)}
        className={`px-4 mb-4 ${isMine ? "items-end" : "items-start"}`}
      >
        {/* Shared look card */}
        <TouchableOpacity
          onPress={() => handleLookPress(item.lookPublicId)}
          activeOpacity={0.8}
          className={`max-w-[280px] rounded-2xl overflow-hidden border ${
            isMine
              ? "bg-primary/10 dark:bg-primary-dark/10 border-primary/20 dark:border-primary-dark/20"
              : "bg-surface dark:bg-surface-dark border-border/30 dark:border-border-dark/30"
          }`}
        >
          {/* Look image */}
          {item.lookImageUrl ? (
            <View className="w-full aspect-[4/5]">
              <Image
                source={{ uri: item.lookImageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />
            </View>
          ) : (
            <View className="w-full aspect-[4/5] bg-surface-alt dark:bg-surface-alt-dark items-center justify-center">
              <Sparkles
                size={24}
                color={isDark ? "#706B63" : "#9C948A"}
              />
              <Text className="text-xs text-muted-foreground dark:text-muted-dark-foreground mt-2">
                Look image
              </Text>
            </View>
          )}

          {/* Look info */}
          <View className="px-3 py-2.5">
            <Text
              className="text-sm font-medium text-foreground dark:text-foreground-dark"
              numberOfLines={1}
            >
              {item.lookName || "Shared Look"}
            </Text>
            <Text className="text-xs text-muted-foreground dark:text-muted-dark-foreground mt-0.5">
              {isMine ? "You shared this look" : "Shared a look with you"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Time */}
        <Text className="text-[10px] text-muted-foreground dark:text-muted-dark-foreground mt-1 px-1">
          {formatMessageTime(item.createdAt)}
        </Text>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Sparkles size={28} color={isDark ? "#706B63" : "#9C948A"} />
      <Text className="text-base font-medium text-foreground dark:text-foreground-dark mt-4 text-center">
        No shared looks yet
      </Text>
      <Text className="text-sm text-muted-foreground dark:text-muted-dark-foreground text-center mt-2 leading-5">
        Looks shared between you will appear here.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      {/* <View
        style={{ paddingTop: insets.top }}
        className="bg-background dark:bg-background-dark border-b border-border/30 dark:border-border-dark/30"
      >
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
          >
            <ChevronLeft size={22} color={isDark ? "#E0D8CC" : "#2D2926"} />
          </TouchableOpacity>
          <Text className="text-lg font-serif font-semibold text-foreground dark:text-foreground-dark flex-1">
            Conversation
          </Text>
        </View>
      </View> */}

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={isDark ? "#C9A07A" : "#A67C52"}
          />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 16,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
