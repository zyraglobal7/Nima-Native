import React from "react";
import { View, Text, StyleSheet, Share, TouchableOpacity } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { Share as ShareIcon, X } from "lucide-react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

interface ClosingSlideProps {
  year: number;
  totalLooksSaved?: number;
  totalTryOns?: number;
  shareToken?: string;
}

export function ClosingSlide({
  year,
  totalLooksSaved,
  totalTryOns,
  shareToken,
}: ClosingSlideProps) {
  const router = useRouter();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my Nima Wrapped for ${year}! https://nima.app/wrapped/${year}?token=${shareToken || ""}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInUp.delay(300)} style={styles.title}>
        That's a wrap!
      </Animated.Text>

      <Animated.View entering={ZoomIn.delay(600)} style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalLooksSaved || 0}</Text>
          <Text style={styles.statLabel}>Looks Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalTryOns || 0}</Text>
          <Text style={styles.statLabel}>Try-Ons</Text>
        </View>
      </Animated.View>

      <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
        <ShareIcon color="#1A1614" size={20} />
        <Text style={styles.shareText}>Share your Wrapped</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/discover")}
        style={styles.closeButton}
      >
        <Text style={styles.closeText}>Back to Nima</Text>
      </TouchableOpacity>
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
    fontSize: 48,
    color: "white",
    fontFamily: "CormorantGaramond_700Bold",
    marginBottom: 60,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 60,
    width: "100%",
    justifyContent: "space-around",
    backdropFilter: "blur(10px)",
  },
  statBox: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    height: "80%",
    alignSelf: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  shareButton: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  shareText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1614",
  },
  closeButton: {
    padding: 16,
  },
  closeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
