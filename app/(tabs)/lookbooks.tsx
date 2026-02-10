import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LookbooksScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-3xl font-serif text-foreground mb-2">
          Lookbooks
        </Text>
        <Text className="text-base text-muted-foreground text-center">
          Your saved collections and looks
        </Text>
      </View>
    </SafeAreaView>
  );
}
