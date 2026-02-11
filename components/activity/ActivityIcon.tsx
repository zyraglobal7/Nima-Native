import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Activity } from "lucide-react-native";
import { useTheme } from "@/lib/contexts/ThemeContext";

export function ActivityIcon() {
  const router = useRouter();
  const { isDark } = useTheme();
  const unreadCount =
    useQuery(api.lookInteractions.queries.getUnreadActivityCount) ?? 0;

  const iconColor = isDark ? "#FAF8F5" : "#1A1614";

  return (
    <TouchableOpacity
      onPress={() => router.push("/activity")}
      className="p-2 -mr-2 rounded-full active:bg-surface-alt relative"
    >
      <Activity size={24} color={iconColor} />
      {unreadCount > 0 && (
        <View className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center border border-background">
          <Text className="text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
