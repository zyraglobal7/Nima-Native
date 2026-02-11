import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WrappedContainer } from "@/components/wrapped/WrappedContainer";
import { IntroSlide } from "@/components/wrapped/slides/IntroSlide";
import { StyleEraSlide } from "@/components/wrapped/slides/StyleEraSlide";
import { TopItemsSlide } from "@/components/wrapped/slides/TopItemsSlide";
import { MostSavedLookSlide } from "@/components/wrapped/slides/MostSavedLookSlide";
import { ClosingSlide } from "@/components/wrapped/slides/ClosingSlide";
import { WrappedThemeType } from "@/components/wrapped/themes";

export default function WrappedScreen() {
  const { year, token } = useLocalSearchParams<{
    year: string;
    token?: string;
  }>();
  const router = useRouter();

  const yearInt = parseInt(year || "2024", 10);

  const wrappedData = useQuery(
    token
      ? api.wrapped.queries.getWrappedByShareToken
      : api.wrapped.queries.getUserWrapped,
    token ? { shareToken: token } : { year: yearInt },
  );

  const markAsViewed = useMutation(api.wrapped.mutations.markWrappedAsViewed);

  const handleClose = async () => {
    if (!token) {
      try {
        await markAsViewed({ year: yearInt });
      } catch (e) {
        console.log("Failed to mark viewed", e);
      }
    }
    router.back();
  };

  if (wrappedData === undefined) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#C08D5D" />
        <Text className="text-white mt-4 font-sans">
          Preparing your Wrapped...
        </Text>
      </View>
    );
  }

  if (wrappedData === null) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-white text-2xl font-serif mb-4">
          Wrapped Not Found
        </Text>
        <Text className="text-gray-400 text-center mb-8 font-sans">
          The wrapped for this year isn't ready yet or the link is invalid.
        </Text>
        <Text
          onPress={() => router.back()}
          className="text-primary font-bold text-lg"
        >
          Go Back
        </Text>
      </View>
    );
  }

  const { wrapped, settings, user } = wrappedData;
  const theme = (settings?.theme || "aurora") as WrappedThemeType;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <WrappedContainer theme={theme} onClose={handleClose}>
        {/* Slide 1: Intro */}
        <IntroSlide year={wrapped.year} firstName={user.firstName} />

        {/* Slide 2: Style Era */}
        <StyleEraSlide
          styleEra={wrapped.styleEra}
          styleEraDescription={wrapped.styleEraDescription}
          dominantTags={wrapped.dominantTags}
        />

        {/* Slide 3: Top Items */}
        <TopItemsSlide topItems={wrapped.topItems} />

        {/* Slide 4: Most Saved Look */}
        <MostSavedLookSlide mostSavedLookId={wrapped.mostSavedLookId} />

        {/* Slide 5: Closing */}
        <ClosingSlide
          year={wrapped.year}
          totalLooksSaved={wrapped.totalLooksSaved}
          totalTryOns={wrapped.totalTryOns}
          shareToken={wrapped.shareToken}
        />
      </WrappedContainer>
    </View>
  );
}
