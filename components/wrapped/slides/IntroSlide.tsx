import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { Sparkles } from "lucide-react-native";

interface IntroSlideProps {
  year: number;
  firstName?: string;
}

export function IntroSlide({ year, firstName }: IntroSlideProps) {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(300).duration(800)}
        style={styles.iconContainer}
      >
        <Sparkles color="white" size={60} />
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.delay(600).duration(800)}
        style={styles.greeting}
      >
        Hi {firstName || "there"},
      </Animated.Text>

      <Animated.Text
        entering={FadeInUp.delay(1000).duration(800)}
        style={styles.title}
      >
        Your {year} Wrapped
      </Animated.Text>

      <Animated.Text
        entering={FadeInUp.delay(1400).duration(800)}
        style={styles.subtitle}
      >
        Let's see what defined your style this year.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: "white",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  greeting: {
    fontSize: 24,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "DMSans_500Medium", // Adjust if font loading is different
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    color: "white",
    fontFamily: "CormorantGaramond_700Bold", // Adjust
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    maxWidth: "80%",
  },
});
