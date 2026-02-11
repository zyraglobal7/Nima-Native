import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageSquare, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatRelativeTime } from "@/lib/utils/format";

export function ConversationList() {
  const router = useRouter();
  const conversations = useQuery(api.directMessages.queries.getConversations);
  const markConversationAsRead = useMutation(
    api.directMessages.mutations.markConversationAsRead,
  );

  const handleConversationClick = async (
    otherUserId: Id<"users">,
    hasUnread: boolean,
  ) => {
    if (hasUnread) {
      await markConversationAsRead({ otherUserId });
    }
    router.push(`/messages/${otherUserId}`);
  };

  if (conversations === undefined) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-16">
        <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-4">
          <MessageSquare size={32} className="text-muted-foreground" />
        </View>
        <Text className="text-lg font-medium text-foreground mb-2 font-serif">
          No messages yet
        </Text>
        <Text className="text-center text-muted-foreground max-w-xs font-sans">
          Looks shared with you will appear here. Share a look with someone to
          start a conversation!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
      <View className="space-y-3">
        {conversations.map((conversation) => {
          const displayName =
            conversation.otherUser.firstName && conversation.otherUser.lastName
              ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
              : conversation.otherUser.username || "User";

          return (
            <TouchableOpacity
              key={conversation.otherUser._id}
              onPress={() =>
                handleConversationClick(
                  conversation.otherUser._id,
                  conversation.unreadCount > 0,
                )
              }
              className="flex-row items-center p-4 rounded-xl bg-surface border border-border space-x-4 active:bg-surface-alt"
            >
              {/* Profile Image */}
              <LinearGradient
                colors={["#C08D5D", "#E5E7EB"]}
                className="w-12 h-12 rounded-full overflow-hidden items-center justify-center"
              >
                {conversation.otherUser.profileImageUrl ? (
                  <Image
                    source={{ uri: conversation.otherUser.profileImageUrl }}
                    className="w-full h-full"
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-primary-foreground font-medium text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </LinearGradient>

              {/* User Info */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    numberOfLines={1}
                    className="font-medium text-foreground font-sans text-base"
                  >
                    {displayName}
                  </Text>
                  {conversation.lastMessage && (
                    <Text className="text-xs text-muted-foreground font-sans">
                      {formatRelativeTime(conversation.lastMessage.createdAt)}
                    </Text>
                  )}
                </View>
                {conversation.lastMessage && (
                  <Text
                    numberOfLines={1}
                    className="text-sm text-muted-foreground font-sans"
                  >
                    {conversation.lastMessage.sentByMe ? "You: " : ""}Shared a
                    look
                  </Text>
                )}
              </View>

              {/* Unread Badge */}
              {conversation.unreadCount > 0 && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Text className="text-xs font-medium text-primary-foreground">
                    {conversation.unreadCount > 9
                      ? "9+"
                      : conversation.unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
