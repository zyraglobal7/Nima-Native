import { View, Text } from "react-native";

export default function DiscardedLooksScreen() {
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
        Discarded Looks
      </Text>
    </View>
  );
}
