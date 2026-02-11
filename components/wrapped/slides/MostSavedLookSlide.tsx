import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { Heart } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const { width } = Dimensions.get("window");

interface MostSavedLookSlideProps {
  mostSavedLookId?: string; // We'll cast to Id<'looks'>
}

export function MostSavedLookSlide({
  mostSavedLookId,
}: MostSavedLookSlideProps) {
  // If no look ID, we can't show much
  const lookDetails = useQuery(
    api.wrapped.queries.getMostSavedLookDetails,
    mostSavedLookId ? { lookId: mostSavedLookId as Id<"looks"> } : "skip",
  );

  if (!mostSavedLookId) return null; // Or show empty state

  if (lookDetails === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="white" />
      </View>
    );
  }

  // If null returned (look not found), show message
  if (lookDetails === null) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>Look not found</Text>
      </View>
    );
  }

  const { look, imageUrl } = lookDetails;

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeIn.delay(300)} style={styles.title}>
        Your Most Loved Look
      </Animated.Text>

      <Animated.View entering={ZoomIn.delay(600)} style={styles.card}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.image,
              {
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Text style={{ color: "#9ca3af" }}>No Look Image</Text>
          </View>
        )}
        <View style={styles.overlay}>
          <Heart fill="white" color="white" size={24} />
        </View>
      </Animated.View>

      <Animated.Text entering={FadeIn.delay(900)} style={styles.name}>
        {look.name || "Untitled Look"}
      </Animated.Text>

      <Animated.Text entering={FadeIn.delay(1100)} style={styles.statLabel}>
        Total Value: {look.currency} {look.totalPrice.toFixed(2)}
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
  title: {
    fontSize: 28,
    color: "white",
    fontFamily: "CormorantGaramond_700Bold",
    marginBottom: 40,
    textAlign: "center",
  },
  card: {
    width: width * 0.8,
    height: width * 1.1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 12,
    borderRadius: 100,
    backdropFilter: "blur(10px)",
  },
  name: {
    marginTop: 24,
    fontSize: 24,
    color: "white",
    fontWeight: "500",
    fontFamily: "CormorantGaramond_700Bold",
  },
  statLabel: {
    marginTop: 8,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },
});
