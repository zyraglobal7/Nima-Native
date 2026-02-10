import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingWizard } from "@/components/onboarding";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <OnboardingWizard
        onComplete={() => {
          router.replace("/(tabs)/discover");
        }}
        onBack={() => {
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
