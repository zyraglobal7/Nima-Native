import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Pressable,
  Modal,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Text } from "@/components/ui/Text";
import {
  Globe,
  Users,
  MessageCircle,
  Link as LinkIcon,
  X,
  Check,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ShareOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  url: string;
  title: string;
  /** When provided, "Share Publicly" and "Share with Friends" use Convex mutations */
  lookId?: Id<"looks">;
  /** Callback to open the user picker for DM sharing */
  onShareViaDM?: () => void;
}

export function ShareOptionsModal({
  visible,
  onClose,
  url,
  title,
  lookId,
  onShareViaDM,
}: ShareOptionsModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [successAction, setSuccessAction] = useState<string | null>(null);

  // Convex mutations for look sharing
  const shareLookPublicly = useMutation(api.looks.mutations.shareLookPublicly);
  const shareLookWithFriends = useMutation(api.looks.mutations.shareLookWithFriends);

  const showSuccess = (action: string) => {
    setSuccessAction(action);
    setTimeout(() => {
      setSuccessAction(null);
      onClose();
    }, 1200);
  };

  const handleSharePublicly = async () => {
    if (lookId) {
      // Call Convex mutation to make the look public
      setIsSharing("public");
      try {
        const result = await shareLookPublicly({ lookId });
        if (result.success) {
          showSuccess("public");
        } else {
          Alert.alert("Error", result.message);
          onClose();
        }
      } catch (error) {
        Alert.alert("Error", "Failed to share publicly");
        onClose();
      } finally {
        setIsSharing(null);
      }
    } else {
      // Fallback to OS share for non-look items
      onClose();
      try {
        await Share.share({
          message: `Check out ${title} on Nima!\n${url}`,
          url,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handleShareWithFriends = async () => {
    if (lookId) {
      // Call Convex mutation to share with friends
      setIsSharing("friends");
      try {
        const result = await shareLookWithFriends({ lookId });
        if (result.success) {
          showSuccess("friends");
        } else {
          Alert.alert("Error", result.message);
          onClose();
        }
      } catch (error) {
        Alert.alert("Error", "Failed to share with friends");
        onClose();
      } finally {
        setIsSharing(null);
      }
    } else {
      // Fallback to OS share
      onClose();
      try {
        await Share.share({
          message: `Hey! I thought you might like this: ${title}\n${url}`,
          url,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handleShareViaDM = async () => {
    if (lookId && onShareViaDM) {
      // Close share modal and open user picker
      onClose();
      onShareViaDM();
    } else {
      // Fallback to OS share
      onClose();
      try {
        await Share.share({
          message: `${title} — ${url}`,
          url,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handleCopyLink = async () => {
    onClose();
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert("Copied", "Link copied to clipboard!");
    } catch {
      // Ignore
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 justify-end"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: isDark ? "#1A1614" : "#FAF8F5",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Handle indicator */}
          <View className="items-center pt-3 pb-2">
            <View
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: isDark ? "#3D3835" : "#E0D8CC" }}
            />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pb-4">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              Share
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: isDark ? "#302B28" : "#EDE6DC" }}
            >
              <X size={18} color={isDark ? "#C4B8A8" : "#6B635B"} />
            </TouchableOpacity>
          </View>

          {/* Share options */}
          <View className="px-6 gap-1">
            {/* Share Publicly */}
            <TouchableOpacity
              onPress={handleSharePublicly}
              activeOpacity={0.7}
              disabled={isSharing !== null}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-xl"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? "#302B28" : "#EDE6DC" }}
              >
                {successAction === "public" ? (
                  <Check size={20} color="#22C55E" />
                ) : isSharing === "public" ? (
                  <ActivityIndicator size="small" color={isDark ? "#C9A07A" : "#A67C52"} />
                ) : (
                  <Globe size={20} color={isDark ? "#C9A07A" : "#A67C52"} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground dark:text-foreground-dark">
                  Share Publicly
                </Text>
                <Text className="text-xs text-muted-foreground dark:text-muted-dark-foreground mt-0.5">
                  {lookId
                    ? "Other users will see this look on Explore"
                    : "Share to social media or any app"}
                </Text>
              </View>
              {successAction === "public" && (
                <Text className="text-xs text-green-500 font-medium">Done!</Text>
              )}
            </TouchableOpacity>

            {/* Share with Friends */}
            <TouchableOpacity
              onPress={handleShareWithFriends}
              activeOpacity={0.7}
              disabled={isSharing !== null}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-xl"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? "#302B28" : "#EDE6DC" }}
              >
                {successAction === "friends" ? (
                  <Check size={20} color="#22C55E" />
                ) : isSharing === "friends" ? (
                  <ActivityIndicator size="small" color={isDark ? "#C9A07A" : "#A67C52"} />
                ) : (
                  <Users size={20} color={isDark ? "#C9A07A" : "#A67C52"} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground dark:text-foreground-dark">
                  Share with Friends
                </Text>
                <Text className="text-xs text-muted-foreground dark:text-muted-dark-foreground mt-0.5">
                  {lookId
                    ? "Only your friends will see this look"
                    : "Send to friends via messaging apps"}
                </Text>
              </View>
              {successAction === "friends" && (
                <Text className="text-xs text-green-500 font-medium">Done!</Text>
              )}
            </TouchableOpacity>

            {/* Share via DM */}
            <TouchableOpacity
              onPress={handleShareViaDM}
              activeOpacity={0.7}
              disabled={isSharing !== null}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-xl"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? "#302B28" : "#EDE6DC" }}
              >
                <MessageCircle size={20} color={isDark ? "#C9A07A" : "#A67C52"} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground dark:text-foreground-dark">
                  Share via DM
                </Text>
                <Text className="text-xs text-muted-foreground dark:text-muted-dark-foreground mt-0.5">
                  {lookId
                    ? "Send this look directly to another user"
                    : "Send a direct message"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View
              className="my-1"
              style={{
                height: 1,
                backgroundColor: isDark ? "#3D3835" : "#E0D8CC",
              }}
            />

            {/* Copy Link */}
            <TouchableOpacity
              onPress={handleCopyLink}
              activeOpacity={0.7}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-xl"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? "#302B28" : "#EDE6DC" }}
              >
                <LinkIcon size={20} color={isDark ? "#C9A07A" : "#A67C52"} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground dark:text-foreground-dark">
                  Copy Link
                </Text>
                <Text className="text-xs text-muted-foreground dark:text-muted-dark-foreground mt-0.5">
                  Copy link to clipboard
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
