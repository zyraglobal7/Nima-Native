import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { ConversationList } from "@/components/messages/ConversationList";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/contexts/ThemeContext";

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-background/95 border-b border-border z-10"
      >
        <View className="px-4 py-3 flex-row items-center justify-between relative">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-surface-alt"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </TouchableOpacity>

          <View className="absolute left-0 right-0 items-center pointer-events-none">
            <Text className="text-lg font-serif font-medium text-foreground">
              Messages
            </Text>
          </View>

          <View className="w-10" />
        </View>
      </View>

      <ConversationList />
    </View>
  );
}
