import { View } from "react-native";
import { Link, useRouter } from "expo-router";
// import { useAuth } from "@clerk/clerk-expo"; // Removed unused auth import
import { GateSplash } from "@/components/landing/GateSplash";

export default function Index() {
  const router = useRouter();

  // Simple navigation handler
  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <View className="flex-1 bg-background">
      <GateSplash onGetStarted={handleGetStarted} />
    </View>
  );
}
