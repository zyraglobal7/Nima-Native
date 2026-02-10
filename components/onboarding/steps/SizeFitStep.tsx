import { View, Text, Pressable, ScrollView } from "react-native";
import {
  StepProps,
  SIZE_OPTIONS,
  ShoeSizeUnit,
  convertShoeSize,
} from "../types";
import {
  trackStepCompleted,
  trackBackClicked,
  ONBOARDING_STEPS,
} from "@/lib/analytics";

// Constants
const DEFAULT_HEIGHT_CM = "170";
const HEIGHT_CM_MIN = 140;
const HEIGHT_CM_MAX = 210;

export function SizeFitStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: StepProps) {
  const handleShoeSizeUnitChange = (newUnit: ShoeSizeUnit) => {
    if (newUnit === formData.shoeSizeUnit) return;
    const convertedSize = convertShoeSize(
      formData.shoeSize,
      formData.shoeSizeUnit,
      newUnit,
    );
    updateFormData({ shoeSizeUnit: newUnit, shoeSize: convertedSize });
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-4 py-6">
        <View className="max-w-md w-full mx-auto">
          <View className="flex-row items-center gap-4 mb-6">
            <Pressable
              onPress={() => {
                trackBackClicked(ONBOARDING_STEPS.SIZE_FIT);
                onBack?.();
              }}
              className="p-2 -ml-2 rounded-full"
            >
              <Text className="text-2xl text-muted-foreground">←</Text>
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-serif font-semibold text-foreground">
                Your perfect fit
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                So I can recommend your ideal sizes
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Form */}
      <ScrollView
        className="flex-1 px-4 pb-6"
        contentContainerClassName="max-w-md mx-auto gap-8"
      >
        {/* Shirt Size */}
        <View className="gap-3">
          <Text className="text-sm font-medium text-foreground">
            👕 Shirt / Top Size
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {SIZE_OPTIONS.shirt.map((size) => {
                const isSelected = formData.shirtSize === size;
                return (
                  <Pressable
                    key={size}
                    onPress={() => updateFormData({ shirtSize: size })}
                    className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Waist Size */}
        <View className="gap-3">
          <Text className="text-sm font-medium text-foreground">
            👖 Waist Size (inches)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {SIZE_OPTIONS.waist.map((size) => {
                const isSelected = formData.waistSize === size;
                return (
                  <Pressable
                    key={size}
                    onPress={() => updateFormData({ waistSize: size })}
                    className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Height */}
        <View className="gap-3">
          <Text className="text-sm font-medium text-foreground">📏 Height</Text>
          {/* Unit Toggle */}
          <View className="flex-row bg-surface rounded-lg overflow-hidden border border-border">
            {(["cm", "ft"] as const).map((unit) => (
              <Pressable
                key={unit}
                onPress={() => {
                  if (unit === "cm" && formData.heightUnit === "ft") {
                    const ft = parseFloat(formData.height) || 5.7;
                    const cm = Math.round(ft * 30.48);
                    updateFormData({ heightUnit: "cm", height: cm.toString() });
                  } else if (unit === "ft" && formData.heightUnit === "cm") {
                    const cm = parseInt(formData.height) || 170;
                    const ft = (cm / 30.48).toFixed(1);
                    updateFormData({ heightUnit: "ft", height: ft });
                  }
                }}
                className={`flex-1 py-2 items-center ${
                  formData.heightUnit === unit ? "bg-primary" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    formData.heightUnit === unit
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {unit}
                </Text>
              </Pressable>
            ))}
          </View>
          {/* Height value as scrollable chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {Array.from(
                { length: Math.round((HEIGHT_CM_MAX - HEIGHT_CM_MIN) / 5) + 1 },
                (_, i) => (HEIGHT_CM_MIN + i * 5).toString(),
              ).map((h) => {
                const displayH =
                  formData.heightUnit === "ft"
                    ? (parseInt(h) / 30.48).toFixed(1)
                    : h;
                const isSelected =
                  formData.heightUnit === "cm"
                    ? formData.height === h
                    : Math.abs(
                        parseFloat(formData.height) - parseFloat(displayH),
                      ) < 0.1;
                return (
                  <Pressable
                    key={h}
                    onPress={() =>
                      updateFormData({
                        height: formData.heightUnit === "ft" ? displayH : h,
                      })
                    }
                    className={`px-4 py-2 rounded-full border-2 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {displayH} {formData.heightUnit}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Shoe Size */}
        <View className="gap-3">
          <Text className="text-sm font-medium text-foreground">
            👟 Shoe Size
          </Text>
          {/* Unit Toggle */}
          <View className="flex-row bg-surface rounded-lg overflow-hidden border border-border">
            {(["EU", "US", "UK"] as const).map((unit) => (
              <Pressable
                key={unit}
                onPress={() => handleShoeSizeUnitChange(unit)}
                className={`flex-1 py-2 items-center ${
                  formData.shoeSizeUnit === unit ? "bg-primary" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    formData.shoeSizeUnit === unit
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {unit}
                </Text>
              </Pressable>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {SIZE_OPTIONS.shoe[formData.shoeSizeUnit].map((size) => {
                const isSelected = formData.shoeSize === size;
                return (
                  <Pressable
                    key={size}
                    onPress={() => updateFormData({ shoeSize: size })}
                    className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Bottom spacer for scroll */}
        <View className="h-4" />
      </ScrollView>

      {/* Footer CTA */}
      <View className="bg-background border-t border-border/50 p-4">
        <Pressable
          onPress={() => {
            trackStepCompleted(ONBOARDING_STEPS.SIZE_FIT, {
              shirt_size: formData.shirtSize,
              waist_size: formData.waistSize,
              height: formData.height,
              height_unit: formData.heightUnit,
              shoe_size: formData.shoeSize,
              shoe_unit: formData.shoeSizeUnit,
            });
            onNext();
          }}
          className="w-full bg-primary py-4 rounded-full items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Text className="text-primary-foreground text-base font-semibold tracking-wide">
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
