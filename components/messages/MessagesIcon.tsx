import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageSquare } from "lucide-react-native";

export function MessagesIcon() {
  const router = useRouter();
  const unreadCount =
    useQuery(api.directMessages.queries.getUnreadMessageCount) ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push("/messages")}
      className="p-2 -mr-2 rounded-full active:bg-surface-alt relative"
    >
      <MessageSquare size={24} className="text-foreground" />
      {unreadCount > 0 && (
        <View className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center border border-background">
          <Text className="text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
