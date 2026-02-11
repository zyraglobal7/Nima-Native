import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TopItemSummary {
  itemId: string;
  name: string;
  count: number;
}

interface TopItemsSlideProps {
  topItems?: TopItemSummary[];
}

function TopItemCard({ item, index }: { item: TopItemSummary; index: number }) {
  const itemDetails = useQuery(api.items.queries.getItemWithImage, {
    itemId: item.itemId as Id<"items">,
  });

  if (!itemDetails) {
    // Loading state
    return (
      <View style={styles.itemCard}>
        <View style={[styles.itemImage, { backgroundColor: "#f3f4f6" }]} />
      </View>
    );
  }

  const { item: fullItem, imageUrl } = itemDetails;

  return (
    <Animated.View
      entering={FadeInUp.delay(600 + index * 200)}
      style={styles.itemCard}
    >
      <Image
        source={{ uri: imageUrl || undefined }}
        style={styles.itemImage}
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text numberOfLines={1} style={styles.itemName}>
          {fullItem.name}
        </Text>
        <Text numberOfLines={1} style={styles.itemBrand}>
          {fullItem.brand}
        </Text>
        <Text style={styles.itemCount}>{item.count} wears</Text>
      </View>
    </Animated.View>
  );
}

export function TopItemsSlide({ topItems }: TopItemsSlideProps) {
  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeIn.delay(300)} style={styles.title}>
        Your Top Picks
      </Animated.Text>

      <View style={styles.grid}>
        {topItems?.slice(0, 4).map((item, index) => (
          <TopItemCard key={item.itemId} item={item} index={index} />
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
  title: {
    fontSize: 32,
    color: "white",
    fontFamily: "CormorantGaramond_700Bold",
    marginBottom: 32,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
  },
  itemCard: {
    width: "45%",
    aspectRatio: 0.75,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    padding: 0,
  },
  itemImage: {
    width: "100%",
    height: "75%",
    backgroundColor: "#f3f4f6",
  },
  itemInfo: {
    padding: 8,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1614",
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 10,
    color: "#6b7280",
  },
  itemCount: {
    fontSize: 10,
    color: "#C08D5D",
    marginTop: 2,
    fontWeight: "500",
  },
});
