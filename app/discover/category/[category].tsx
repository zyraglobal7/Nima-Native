import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function DiscoverCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FAF8F5",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "600", color: "#2D2926" }}>
        Category: {category}
      </Text>
    </View>
  );
}
