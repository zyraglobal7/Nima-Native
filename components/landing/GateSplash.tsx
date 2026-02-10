import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Easing, Dimensions, StyleSheet } from "react-native";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { LinearGradient } from "expo-linear-gradient";
import { ChatBubble } from "./ChatBubble";
import { useRouter } from "expo-router";
import { launchWorkOSAuth } from "@/lib/auth";

interface GateSplashProps {
  onGetStarted?: () => void;
}

export function GateSplash({ onGetStarted }: GateSplashProps) {
  const router = useRouter();

  // Animations
  const sunAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Rising Sun Animation Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // color interpolation not supported on native driver
        }),
        Animated.timing(sunAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();

    // Content Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Interpolated Background Values
  const sunPositionY = sunAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["100%", "0%"],
  });

  const sunOpacity = sunAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.4],
  });

  const handleSignIn = async () => {
    try {
      const result = await launchWorkOSAuth("sign-in");
      if (result) {
        // Auth successful — navigate to main app
        router.replace("/(tabs)/discover");
      }
      // If result is null, user cancelled — do nothing
    } catch (err) {
      console.error("[SIGN_IN] Error:", err);
    }
  };

  return (
    <View className="flex-1 bg-background relative overflow-hidden">
      {/* Animated Background Layers */}
      {/* We use absolute positioned views with gradients to simulate the CSS radial gradients */}

      {/* Secondary Gradient Orb (Bottom/Rising) */}
      {/* Secondary Gradient Orb (Bottom/Rising) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: sunOpacity }]}>
        {/* Layer 1: Deep Burgundy Glow at very bottom */}
        <LinearGradient
          colors={["transparent", "rgba(92, 42, 51, 0.2)"]} // Primary
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
        />
        {/* Layer 2: Camel/Gold Rising Sun Effect */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(166, 124, 82, 0.15)", // Secondary
            "rgba(201, 160, 122, 0.2)", // Rose Gold
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Ambient Orbs */}
      <View className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-secondary opacity-10 blur-3xl" />
      <View className="absolute bottom-1/4 -right-20 w-48 h-48 rounded-full bg-primary opacity-10 blur-3xl" />

      {/* Content Container */}
      <View className="flex-1 items-center justify-center px-6 py-12">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: "center",
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* Logo */}
          <View className="items-center mb-8">
            <Text
              variant="h1"
              className="text-5xl md:text-6xl tracking-tight text-center"
            >
              Nima
            </Text>
            <Text className="text-sm uppercase tracking-[0.3em] text-muted-foreground mt-2 font-light">
              AI Stylist
            </Text>
          </View>

          {/* Chat Bubble */}
          <View className="mb-10 items-center">
            <ChatBubble />
          </View>

          {/* Tagline */}
          <View className="items-center mb-12 space-y-3">
            <Text className="text-center leading-8 text-xl font-serif font-medium text-foreground">
              Your personal AI stylist.
            </Text>
            <Text
              variant="large"
              className="text-muted-foreground font-light text-center"
            >
              See yourself in every outfit.
            </Text>
          </View>

          {/* Actions */}
          <View className="w-full max-w-[18rem] space-y-4">
            <Button
              size="lg"
              label="Get Started"
              onPress={onGetStarted}
              className="w-full shadow-lg shadow-primary/20"
            />

            <View className="flex-row justify-center mt-6">
              <Text className="text-muted-foreground text-sm">
                Already a member?{" "}
              </Text>
              <Text
                className="text-secondary text-sm font-medium underline"
                onPress={handleSignIn}
              >
                Sign in
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Fade */}
      <LinearGradient
        colors={["transparent", "rgba(237, 230, 220, 0.3)"]} // surface-alt with opacity
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
        }}
        pointerEvents="none"
      />
    </View>
  );
}
