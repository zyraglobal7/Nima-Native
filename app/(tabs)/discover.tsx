import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiscoverScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-3xl font-serif text-foreground mb-2">
          Discover
        </Text>
        <Text className="text-base text-muted-foreground text-center">
          Browse curated looks and trending items
        </Text>
      </View>
    </SafeAreaView>
  );
}
