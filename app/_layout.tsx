import "../global.css";

import { useState, useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { useAuthFromWorkOS } from "@/lib/auth";
import { UserDataSync } from "@/components/UserDataSync";

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Create Convex client (single instance)
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans: DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    CormorantGaramond: CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ConvexProviderWithAuth client={convex} useAuth={useAuthFromWorkOS}>
          <UserDataSync />
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#FAF8F5" },
              animation: "slide_from_right",
            }}
          >
            {/* Tab navigator */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Auth screens — presented as modals */}
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
                presentation: "modal",
              }}
            />

            {/* Onboarding — full screen, no back gesture */}
            <Stack.Screen
              name="onboarding"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />

            {/* Detail screens — stack push */}
            <Stack.Screen
              name="product/[id]"
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="look/[id]"
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="fitting/[sessionId]"
              options={{ headerShown: true, title: "Fitting Room" }}
            />
            <Stack.Screen
              name="lookbook/[id]"
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="ask/[chatId]"
              options={{ headerShown: true, title: "Ask Nima" }}
            />
            <Stack.Screen
              name="discover/category/[category]"
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="discover/gender/[gender]"
              options={{ headerShown: true, title: "" }}
            />

            {/* Utility screens */}
            <Stack.Screen
              name="cart"
              options={{ headerShown: true, title: "Cart" }}
            />
            <Stack.Screen
              name="checkout"
              options={{ headerShown: true, title: "Checkout" }}
            />
            <Stack.Screen
              name="orders/index"
              options={{ headerShown: true, title: "Orders" }}
            />
            <Stack.Screen
              name="orders/[id]"
              options={{ headerShown: true, title: "Order Details" }}
            />
            <Stack.Screen
              name="messages/index"
              options={{ headerShown: true, title: "Messages" }}
            />
            <Stack.Screen
              name="messages/[userId]"
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="activity"
              options={{ headerShown: true, title: "Activity" }}
            />
            <Stack.Screen
              name="explore"
              options={{ headerShown: true, title: "Explore" }}
            />
            <Stack.Screen
              name="profile/discarded-looks"
              options={{ headerShown: true, title: "Discarded Looks" }}
            />
            <Stack.Screen
              name="profile/settings"
              options={{ headerShown: true, title: "Settings" }}
            />
          </Stack>
        </ConvexProviderWithAuth>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
