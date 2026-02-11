import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, UserPlus } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

interface FriendRequestPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onIgnore: () => void;
  sharedBy: {
    _id: Id<"users">;
    firstName?: string;
    username?: string;
    profileImageUrl?: string;
  };
}

export function FriendRequestPopup({
  isOpen,
  onClose,
  onIgnore,
  sharedBy,
}: FriendRequestPopupProps) {
  const [isSending, setIsSending] = useState(false);
  const sendFriendRequest = useMutation(
    api.friends.mutations.sendFriendRequest,
  );

  const displayName = sharedBy.firstName || sharedBy.username || "Someone";

  const handleAddFriend = async () => {
    setIsSending(true);
    try {
      const result = await sendFriendRequest({ addresseeId: sharedBy._id });
      if (result.success) {
        Toast.show({
          type: "success",
          text1: `Friend request sent to ${displayName}!`,
        });
        onClose();
      } else {
        Toast.show({
          type: "error",
          text1: result.error || "Failed to send friend request",
        });
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
      Toast.show({ type: "error", text1: "Failed to send friend request" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-sm bg-background rounded-2xl p-6 shadow-xl border border-border">
              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                className="absolute top-4 right-4 p-2 rounded-full active:bg-surface z-10"
              >
                <X size={16} className="text-muted-foreground" />
              </TouchableOpacity>

              {/* Content */}
              <View className="items-center space-y-4">
                {/* Profile Image */}
                <LinearGradient
                  colors={["#C08D5D", "#E5E7EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-16 h-16 rounded-full overflow-hidden items-center justify-center"
                >
                  {sharedBy.profileImageUrl ? (
                    <Image
                      source={{ uri: sharedBy.profileImageUrl }}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  ) : (
                    <View className="items-center justify-center w-full h-full bg-surface-alt">
                      <UserPlus size={32} className="text-muted-foreground" />
                    </View>
                  )}
                </LinearGradient>

                {/* Message */}
                <View className="items-center">
                  <Text className="text-lg font-serif font-semibold text-foreground text-center mb-1">
                    {displayName} shared this look with you
                  </Text>
                  <Text className="text-sm text-muted-foreground font-sans text-center">
                    Add them as a friend to see more of their looks
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-3 pt-2 w-full">
                  <TouchableOpacity
                    onPress={() => {
                      onIgnore();
                      onClose();
                    }}
                    disabled={isSending}
                    className="flex-1 h-11 bg-surface border border-border/50 rounded-full items-center justify-center opacity-90 active:opacity-100"
                  >
                    <Text className="font-medium text-foreground font-sans">
                      Ignore
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddFriend}
                    disabled={isSending}
                    className="flex-1 h-11 bg-primary rounded-full flex-row items-center justify-center space-x-2 active:opacity-90"
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <UserPlus size={16} color="#fff" />
                        <Text className="font-medium text-primary-foreground font-sans">
                          Add Friend
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
