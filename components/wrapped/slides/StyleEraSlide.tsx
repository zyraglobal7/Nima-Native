import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";

interface StyleEraSlideProps {
  styleEra?: string;
  styleEraDescription?: string;
  dominantTags?: string[];
}

export function StyleEraSlide({
  styleEra,
  styleEraDescription,
  dominantTags,
}: StyleEraSlideProps) {
  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInUp.delay(300)} style={styles.eyebrow}>
        Your Style Era
      </Animated.Text>

      <Animated.Text entering={FadeInLeft.delay(600)} style={styles.eraTitle}>
        {styleEra || "The Explorer"}
      </Animated.Text>

      <Animated.Text
        entering={FadeInRight.delay(900)}
        style={styles.description}
      >
        {styleEraDescription ||
          "You tried a bit of everything this year, exploring new looks."}
      </Animated.Text>

      <View style={styles.tagsContainer}>
        {dominantTags?.map((tag, index) => (
          <Animated.View
            key={tag}
            entering={FadeInUp.delay(1200 + index * 200)}
            style={styles.tag}
          >
            <Text style={styles.tagText}>#{tag}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  eyebrow: {
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 12,
  },
  eraTitle: {
    fontSize: 56,
    fontFamily: "CormorantGaramond_700Bold",
    color: "white",
    lineHeight: 60,
    marginBottom: 24,
  },
  description: {
    fontSize: 20,
    color: "white",
    lineHeight: 28,
    marginBottom: 40,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  tagText: {
    color: "white",
    fontWeight: "500",
  },
});
