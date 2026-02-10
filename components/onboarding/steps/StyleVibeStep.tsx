import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { StepProps, STYLE_TAGS } from "../types";
import {
  trackStepCompleted,
  trackBackClicked,
  trackStylePreferenceToggled,
  ONBOARDING_STEPS,
} from "@/lib/analytics";

export function StyleVibeStep({ updateFormData, onNext, onBack }: StepProps) {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const toggleStyle = (style: string) => {
    const isCurrentlySelected = selectedStyles.includes(style);
    trackStylePreferenceToggled(style, !isCurrentlySelected);

    setSelectedStyles((prev) =>
      isCurrentlySelected ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const handleContinue = () => {
    trackStepCompleted(ONBOARDING_STEPS.STYLE_VIBE, {
      style_count: selectedStyles.length,
      styles: selectedStyles,
    });
    updateFormData({ stylePreferences: selectedStyles });
    onNext();
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-4 py-6 border-b border-border/50">
        <View className="max-w-md w-full mx-auto">
          <View className="flex-row items-center gap-4 mb-4">
            <Pressable
              onPress={() => {
                trackBackClicked(ONBOARDING_STEPS.STYLE_VIBE);
                onBack?.();
              }}
              className="p-2 -ml-2 rounded-full"
            >
              <Text className="text-2xl text-muted-foreground">←</Text>
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-serif font-semibold text-foreground">
                What's your vibe?
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Pick the styles that resonate with you
              </Text>
            </View>
          </View>

          {/* Selection counter */}
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted-foreground">
              {selectedStyles.length} selected{" "}
              {selectedStyles.length > 0 && "✓"}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Select at least 3
            </Text>
          </View>
        </View>
      </View>

      {/* Style Tags Grid */}
      <ScrollView
        className="flex-1 px-4 py-6"
        contentContainerClassName="max-w-md mx-auto"
      >
        <View className="flex-row flex-wrap gap-3">
          {STYLE_TAGS.map((style) => {
            const isSelected = selectedStyles.includes(style);
            return (
              <Pressable
                key={style}
                onPress={() => toggleStyle(style)}
                className={`px-5 py-3 rounded-full border-2 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? "text-primary" : "text-foreground"
                  }`}
                >
                  {isSelected ? "✓ " : ""}
                  {style}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View className="bg-background border-t border-border/50 p-4">
        <Pressable
          onPress={handleContinue}
          disabled={selectedStyles.length < 3}
          className={`w-full py-4 rounded-full items-center ${
            selectedStyles.length >= 3 ? "bg-primary" : "bg-primary/50"
          }`}
          style={({ pressed }) => ({
            opacity: selectedStyles.length >= 3 && pressed ? 0.85 : 1,
          })}
        >
          <Text className="text-primary-foreground text-base font-semibold tracking-wide">
            {selectedStyles.length < 3
              ? `Select ${3 - selectedStyles.length} more`
              : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
