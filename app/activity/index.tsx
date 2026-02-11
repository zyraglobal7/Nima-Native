import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  Heart,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NotificationItem,
  ActivityNotification,
} from "@/components/activity/NotificationItem";
import { useTheme } from "@/lib/contexts/ThemeContext";
import Toast from "react-native-toast-message";

// Simple Sound Logic (Stubbed for Native)
// In a real app we would use expo-av
const playSoftNotificationSound = async () => {
  // Logic to play sound
};

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [isSoundMuted, setIsSoundMuted] = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const notifications = useQuery(
    api.lookInteractions.queries.getActivityNotifications,
    { limit: 50 },
  );
  const unreadCount = useQuery(
    api.lookInteractions.queries.getUnreadActivityCount,
  );
  const markAsSeen = useMutation(
    api.lookInteractions.mutations.markActivityAsSeen,
  );

  const previousCountRef = useRef<number>(0);
  const hasLoadedRef = useRef(false);

  // Sound Logic
  useEffect(() => {
    if (!notifications || !hasLoadedRef.current) {
      if (notifications) {
        hasLoadedRef.current = true;
        previousCountRef.current = notifications.filter(
          (n) => !n.seenByOwner,
        ).length;
      }
      return;
    }

    const currentUnseenCount = notifications.filter(
      (n) => !n.seenByOwner,
    ).length;
    if (currentUnseenCount > previousCountRef.current && !isSoundMuted) {
      playSoftNotificationSound();
    }
    previousCountRef.current = currentUnseenCount;
  }, [notifications, isSoundMuted]);

  // Mark All Read
  const handleMarkAllAsRead = async () => {
    if (!notifications || isMarkingRead) return;

    const unreadIds = notifications
      .filter((n) => !n.seenByOwner)
      .map((n) => n._id);

    if (unreadIds.length === 0) return;

    setIsMarkingRead(true);
    try {
      await markAsSeen({ interactionIds: unreadIds });
      Toast.show({ type: "success", text1: "All marked as read" });
    } catch (error) {
      console.error("Failed to mark as read:", error);
      Toast.show({ type: "error", text1: "Failed to mark as read" });
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Group Notifications
  const groupedNotifications = useMemo(() => {
    if (!notifications) return null;

    return notifications.reduce(
      (groups, notification) => {
        const date = new Date(notification.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let groupKey: string;
        if (date.toDateString() === today.toDateString()) {
          groupKey = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
          groupKey = "Yesterday";
        } else {
          groupKey = date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          });
        }

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(notification as unknown as ActivityNotification);
        return groups;
      },
      {} as Record<string, ActivityNotification[]>,
    );
  }, [notifications]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-background/95 border-b border-border z-10"
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2 rounded-full active:bg-surface-alt"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </TouchableOpacity>
            <Text className="text-lg font-serif font-medium text-foreground ml-2">
              Your Activity
            </Text>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => setIsSoundMuted(!isSoundMuted)}
              className="p-2 rounded-full active:bg-surface-alt"
            >
              {isSoundMuted ? (
                <BellOff size={20} className="text-muted-foreground" />
              ) : (
                <Bell size={20} className="text-foreground" />
              )}
            </TouchableOpacity>

            {unreadCount !== undefined && unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                disabled={isMarkingRead}
                className="flex-row items-center px-3 py-1.5 bg-primary/10 rounded-full space-x-1"
              >
                {isMarkingRead ? (
                  <Loader2 size={14} className="text-primary animate-spin" />
                ) : (
                  <CheckCheck size={14} className="text-primary" />
                )}
                <Text className="text-xs font-medium text-primary">
                  Mark Read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {notifications === undefined ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" className="text-primary" />
          </View>
        ) : notifications.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-4">
              <Heart size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-medium text-foreground mb-2 font-serif">
              No activity yet
            </Text>
            <Text className="text-center text-muted-foreground font-sans max-w-xs">
              When people love or save your looks, you'll see their activity
              here.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/discover")}
              className="mt-6 px-6 py-3 bg-primary rounded-full"
            >
              <Text className="text-primary-foreground font-medium font-sans">
                Share a look
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-6 pb-10">
            {groupedNotifications &&
              Object.entries(groupedNotifications).map(([date, items]) => (
                <View key={date} className="space-y-3">
                  <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-sans ml-1">
                    {date}
                  </Text>
                  <View>
                    {items.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        isNew={!notification.seenByOwner}
                      />
                    ))}
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
