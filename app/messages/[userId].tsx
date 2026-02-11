import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ChatInterface } from "@/components/messages/ChatInterface";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams();
  const otherUserId = userId as Id<"users">;

  const otherUser = useQuery(api.users.queries.getUser, {
    userId: otherUserId,
  });

  const displayName =
    otherUser?.firstName && otherUser?.lastName
      ? `${otherUser.firstName} ${otherUser.lastName}`
      : otherUser?.username || "User";

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-background/95 border-b border-border z-10"
      >
        <View className="px-4 py-3 flex-row items-center relative">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-surface-alt z-20"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </TouchableOpacity>

          <View className="absolute left-0 right-0 items-center justify-center p-2 z-10">
            <Text
              numberOfLines={1}
              className="text-lg font-serif font-medium text-foreground max-w-[70%] text-center"
            >
              {displayName}
            </Text>
          </View>
        </View>
      </View>

      <ChatInterface otherUserId={otherUserId} />
    </View>
  );
}
