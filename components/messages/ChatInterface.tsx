import React, { useState, useEffect } from "react";
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
import { Sparkles, UserPlus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { formatRelativeTime } from "@/lib/utils/format";
import { RecreateLookButton } from "@/components/looks/RecreateLookButton";
import { FriendRequestPopup } from "@/components/friends/FriendRequestPopup";

interface ChatInterfaceProps {
  otherUserId: Id<"users">;
}

export function ChatInterface({ otherUserId }: ChatInterfaceProps) {
  const router = useRouter();
  const [showFriendRequestPopup, setShowFriendRequestPopup] = useState(false);

  const messages = useQuery(
    api.directMessages.queries.getConversationMessages,
    {
      otherUserId,
    },
  );
  const otherUser = useQuery(api.users.queries.getUser, {
    userId: otherUserId,
  });
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const areFriends = useQuery(api.friends.queries.areFriends, {
    userId: otherUserId,
  });
  const hasSentRequest = useQuery(api.friends.queries.hasSentFriendRequest, {
    userId: otherUserId,
  });
  const markConversationAsRead = useMutation(
    api.directMessages.mutations.markConversationAsRead,
  );

  // Mark Read Effect
  useEffect(() => {
    if (otherUserId && areFriends !== undefined) {
      markConversationAsRead({ otherUserId }).catch(console.error);
    }
  }, [otherUserId, areFriends]);

  // Friend Request Popup Trigger
  useEffect(() => {
    if (
      areFriends === false &&
      hasSentRequest === false &&
      otherUser &&
      currentUser
    ) {
      // In native, maybe don't auto-popup, but show a banner. The web does both.
      // We will show a banner primarily.
    }
  }, [areFriends, hasSentRequest, otherUser, currentUser]);

  if (
    messages === undefined ||
    otherUser === undefined ||
    areFriends === undefined
  ) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  if (otherUser === null) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground font-sans">User not found</Text>
      </View>
    );
  }

  const displayName =
    otherUser.firstName && otherUser.lastName
      ? `${otherUser.firstName} ${otherUser.lastName}`
      : otherUser.username || "User";

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Friend Request Banner */}
        {areFriends === false && (
          <View className="mb-6 p-4 bg-surface border border-border rounded-xl flex-row items-center justify-between">
            <View className="flex-row items-center space-x-3 flex-1">
              <LinearGradient
                colors={["#C08D5D", "#E5E7EB"]}
                className="w-10 h-10 rounded-full overflow-hidden items-center justify-center"
              >
                {otherUser.profileImageUrl ? (
                  <Image
                    source={{ uri: otherUser.profileImageUrl }}
                    className="w-full h-full"
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-primary-foreground font-bold">
                    {displayName.charAt(0)}
                  </Text>
                )}
              </LinearGradient>
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className="font-medium text-foreground font-sans"
                >
                  {displayName}
                </Text>
                <Text className="text-xs text-muted-foreground font-sans">
                  {hasSentRequest ? "Friend request sent" : "Not your friend"}
                </Text>
              </View>
            </View>

            {hasSentRequest ? (
              <View className="px-3 py-1.5 bg-primary/10 rounded-full">
                <Text className="text-primary text-xs font-medium font-sans">
                  Request Sent
                </Text>
              </View>
            ) : (
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setShowFriendRequestPopup(true)}
                  className="px-3 py-1.5 bg-primary rounded-full"
                >
                  <Text className="text-primary-foreground text-xs font-medium font-sans">
                    Add Friend
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Messages List */}
        {messages.length === 0 ? (
          <View className="items-center justify-center py-12">
            <View className="w-16 h-16 rounded-full bg-surface-alt items-center justify-center mb-4">
              <Sparkles size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-medium text-foreground mb-2 font-serif">
              No messages yet
            </Text>
            <Text className="text-center text-muted-foreground font-sans">
              Looks shared between you and {displayName} will appear here.
            </Text>
          </View>
        ) : (
          <View className="space-y-6">
            {messages.map((message) => {
              const isMe = message.sentByMe;
              return (
                <View
                  key={message._id}
                  className={`flex-row ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <View
                    className={`max-w-[80%] ${isMe ? "items-end" : "items-start"}`}
                  >
                    {/* Look Card */}
                    <TouchableOpacity
                      onPress={() => router.push(`/look/${message.lookId}`)}
                      className="rounded-xl overflow-hidden border border-border bg-surface w-48"
                    >
                      <View className="aspect-[3/4] bg-surface-alt relative w-full">
                        {message.lookImageUrl ? (
                          <Image
                            source={{ uri: message.lookImageUrl }}
                            className="w-full h-full"
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Sparkles
                              size={32}
                              className="text-muted-foreground"
                            />
                          </View>
                        )}
                      </View>
                      <View className="p-3">
                        <Text
                          numberOfLines={1}
                          className="text-sm font-medium text-foreground font-sans"
                        >
                          {message.lookName || "Look"}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-1 font-sans">
                          {formatRelativeTime(message.createdAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Recreate Button (for received messages) */}
                    {!isMe && currentUser && (
                      <View className="mt-2">
                        <RecreateLookButton
                          lookId={message.lookId}
                          creatorUserId={otherUserId}
                          currentUserId={currentUser._id}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Friend Request Popup */}
      <FriendRequestPopup
        isOpen={showFriendRequestPopup}
        onClose={() => setShowFriendRequestPopup(false)}
        onIgnore={() => setShowFriendRequestPopup(false)}
        sharedBy={otherUser}
      />
    </View>
  );
}
