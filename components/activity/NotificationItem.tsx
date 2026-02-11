import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Heart, Bookmark, Bell, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatRelativeTime } from "@/lib/utils/format";
import { Id } from "@/convex/_generated/dataModel";

// Notification item type matches Nima-Convex interface
export interface ActivityNotification {
  _id: Id<"look_interactions">;
  interactionType: "love" | "dislike" | "save" | "recreate";
  createdAt: number;
  seenByOwner: boolean;
  look: {
    _id: Id<"looks">;
    publicId: string;
    occasion?: string;
  };
  user: {
    _id: Id<"users">;
    firstName?: string;
    username?: string;
    profileImageUrl?: string;
  };
}

interface NotificationItemProps {
  notification: ActivityNotification;
  isNew: boolean;
}

export function NotificationItem({
  notification,
  isNew,
}: NotificationItemProps) {
  const router = useRouter();
  const userName =
    notification.user.firstName || notification.user.username || "Someone";

  const getActionDetails = () => {
    switch (notification.interactionType) {
      case "love":
        return {
          text: "loved",
          icon: (
            <Heart
              size={20}
              className="fill-destructive text-destructive"
              color="#ef4444"
              fill="#ef4444"
            />
          ),
        };
      case "save":
        return {
          text: "saved",
          icon: (
            <Bookmark
              size={20}
              className="fill-primary text-primary"
              color="#C08D5D"
              fill="#C08D5D"
            />
          ),
        };
      case "recreate":
        return {
          text: "recreated",
          icon: (
            <Sparkles size={20} className="text-amber-500" color="#f59e0b" />
          ),
        };
      default:
        return {
          text: "interacted with",
          icon: (
            <Bell size={20} className="text-muted-foreground" color="#9ca3af" />
          ),
        };
    }
  };

  const { text: actionText, icon } = getActionDetails();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/look/${notification.look._id}`)}
      className={`
        flex-row items-start p-4 rounded-xl border mb-3
        ${isNew ? "bg-primary/5 border-primary/20" : "bg-surface border-border active:bg-surface-alt"}
      `}
    >
      {/* User Avatar */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          // Navigate to profile if needed, currently we just stick to look navigation usually
          // router.push(`/profile/${notification.user._id}`)
        }}
        className="mr-3"
      >
        <LinearGradient
          colors={["#C08D5D", "#E5E7EB"]}
          className="w-10 h-10 rounded-full overflow-hidden items-center justify-center"
        >
          {notification.user.profileImageUrl ? (
            <Image
              source={{ uri: notification.user.profileImageUrl }}
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <Text className="text-primary-foreground font-bold">
              {userName.charAt(0).toUpperCase()}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Content */}
      <View className="flex-1 mr-2">
        <Text className="text-sm text-foreground font-sans leading-5">
          <Text className="font-medium">{userName}</Text> {actionText} your look
          {notification.look.occasion && (
            <Text className="text-muted-foreground">
              {" "}
              • {notification.look.occasion}
            </Text>
          )}
        </Text>
        <Text className="text-xs text-muted-foreground mt-1 font-sans">
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>

      {/* Action Icon */}
      <View className="mt-1">{icon}</View>

      {/* New Dot */}
      {isNew && <View className="ml-2 w-2 h-2 rounded-full bg-primary mt-2" />}
    </TouchableOpacity>
  );
}
