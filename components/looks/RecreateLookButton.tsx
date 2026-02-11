import React, { useState } from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RefreshCw } from "lucide-react-native";
import Toast from "react-native-toast-message";

interface RecreateLookButtonProps {
  lookId: Id<"looks">;
  creatorUserId?: Id<"users">;
  currentUserId?: Id<"users">;
}

export function RecreateLookButton({
  lookId,
  creatorUserId,
  currentUserId,
}: RecreateLookButtonProps) {
  const router = useRouter();
  const [isRecreating, setIsRecreating] = useState(false);
  const recreateLook = useMutation(api.looks.mutations.recreateLook);

  // Only show button if user is not the creator
  if (creatorUserId && currentUserId && creatorUserId === currentUserId) {
    return null;
  }

  const handleRecreate = async () => {
    setIsRecreating(true);
    try {
      const result = await recreateLook({ lookId });
      if (result.success && result.publicId) {
        Toast.show({
          type: "success",
          text1: "Look recreated!",
          text2: "Generating your personalized version...",
        });
        // Navigate to the new look using publicId or returned lookId if available logic aligns with route
        // Assuming route uses ID
        if (result.lookId) {
          router.push(`/look/${result.lookId}`);
        }
      } else {
        Toast.show({
          type: "error",
          text1: result.error || "Failed to recreate look",
        });
      }
    } catch (error) {
      console.error("Failed to recreate look:", error);
      Toast.show({ type: "error", text1: "Failed to recreate look" });
    } finally {
      setIsRecreating(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleRecreate}
      disabled={isRecreating}
      className={`
        flex-row items-center justify-center px-4 py-2.5 rounded-full
        bg-surface border border-border/50 space-x-2
        active:opacity-80
        ${isRecreating ? "opacity-70" : ""}
      `}
    >
      {isRecreating ? (
        <ActivityIndicator size="small" className="text-primary" />
      ) : (
        <RefreshCw size={16} className="text-muted-foreground" />
      )}
      <Text className="font-medium text-foreground font-sans text-sm">
        {isRecreating ? "Recreating..." : "Recreate Look"}
      </Text>
    </TouchableOpacity>
  );
}
