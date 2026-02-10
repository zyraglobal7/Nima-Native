import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AskScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-3xl font-serif text-foreground mb-2">
          Ask Nima
        </Text>
        <Text className="text-base text-muted-foreground text-center">
          Your AI stylist is ready to help
        </Text>
      </View>
    </SafeAreaView>
  );
}
