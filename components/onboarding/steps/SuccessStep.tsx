import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { StepProps } from "../types";
import {
  trackOnboardingCompleted,
  trackStartExploringClicked,
} from "@/lib/analytics";

export function SuccessStep({ formData }: StepProps) {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    trackOnboardingCompleted({
      gender: formData.gender || undefined,
      age: formData.age || undefined,
      style_count: formData.stylePreferences.length,
      country: formData.country || undefined,
      budget_range: formData.budgetRange || undefined,
      photo_count: formData.uploadedImages?.length || 0,
    });

    const timer1 = setTimeout(() => setShowContent(true), 300);
    const timer2 = setTimeout(() => setShowDetails(true), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [formData]);

  const handleStartExploring = () => {
    trackStartExploringClicked();
    router.replace("/(tabs)/discover");
  };

  return (
    <View className="flex-1 justify-center items-center px-6 py-12">
      {/* Celebration bg */}
      <View className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full" />
      <View className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/5 rounded-full" />

      <View className="items-center gap-8 max-w-sm">
        {/* Success icon */}
        <View
          className="w-24 h-24 rounded-full bg-primary items-center justify-center"
          style={{ opacity: showContent ? 1 : 0 }}
        >
          <Text className="text-4xl">✨</Text>
        </View>

        {/* Heading */}
        <View
          className="items-center gap-3"
          style={{ opacity: showContent ? 1 : 0 }}
        >
          <Text className="text-4xl font-serif font-semibold text-foreground">
            You're in!
          </Text>
          <Text className="text-lg text-muted-foreground">
            Welcome to the club.
          </Text>
        </View>

        {/* Profile summary */}
        <View
          className="bg-surface rounded-2xl p-6 w-full gap-4"
          style={{ opacity: showDetails ? 1 : 0 }}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-green-500">✓</Text>
            <Text className="text-sm font-medium text-foreground">
              Your style profile is ready
            </Text>
          </View>
          <View className="gap-3">
            {formData.stylePreferences.length > 0 && (
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground text-sm w-20">
                  Style:
                </Text>
                <Text className="text-foreground text-sm flex-1">
                  {formData.stylePreferences.slice(0, 3).join(", ")}
                  {formData.stylePreferences.length > 3 &&
                    ` +${formData.stylePreferences.length - 3} more`}
                </Text>
              </View>
            )}
            {formData.shirtSize && (
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground text-sm w-20">
                  Size:
                </Text>
                <Text className="text-foreground text-sm flex-1">
                  {formData.shirtSize} top, {formData.waistSize} waist
                </Text>
              </View>
            )}
            {formData.country && (
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground text-sm w-20">
                  Location:
                </Text>
                <Text className="text-foreground text-sm flex-1">
                  {formData.country}
                </Text>
              </View>
            )}
            {formData.uploadedImages.length > 0 && (
              <View className="flex-row gap-2">
                <Text className="text-muted-foreground text-sm w-20">
                  Photos:
                </Text>
                <Text className="text-foreground text-sm flex-1">
                  {formData.uploadedImages.length} uploaded
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* What's next */}
        <Text
          className="text-sm text-muted-foreground"
          style={{ opacity: showDetails ? 1 : 0 }}
        >
          I'm already curating outfits just for you...
        </Text>

        {/* CTA */}
        <Pressable
          onPress={handleStartExploring}
          className="w-full max-w-xs bg-primary py-4 rounded-full items-center"
          style={({ pressed }) => ({
            opacity: showDetails ? (pressed ? 0.85 : 1) : 0,
          })}
        >
          <Text className="text-primary-foreground text-base font-semibold tracking-wide">
            Start Exploring
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
