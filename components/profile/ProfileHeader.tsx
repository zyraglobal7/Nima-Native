import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Camera, User } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ProfileHeaderProps {
  onEdit: () => void;
}

export function ProfileHeader({ onEdit }: ProfileHeaderProps) {
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  if (!currentUser) return null;

  return (
    <View className="flex-row items-center space-x-4 mb-4">
      <View className="relative">
        <View className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden items-center justify-center">
          {currentUser.profileImageUrl ? (
            <Image
              source={{ uri: currentUser.profileImageUrl }}
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <User size={40} color="#9CA3AF" />
          )}
        </View>
        <TouchableOpacity
          onPress={onEdit}
          className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm"
        >
          <Camera size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <Text className="text-2xl font-serif text-foreground">
          {currentUser.firstName || currentUser.email?.split("@")[0] || "User"}
          {currentUser.lastName ? ` ${currentUser.lastName}` : ""}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {currentUser.email}
        </Text>
        <View className="bg-secondary self-start px-3 py-1 rounded-full mt-2">
          <Text className="text-xs text-white font-medium capitalize">
            {currentUser.subscriptionTier === "style_pass"
              ? "Style Pass"
              : currentUser.subscriptionTier === "vip"
                ? "VIP"
                : "Free Plan"}
          </Text>
        </View>
      </View>
    </View>
  );
}
