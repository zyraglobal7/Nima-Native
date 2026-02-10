import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { launchWorkOSAuth } from "@/lib/auth";

export default function SignUpScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await launchWorkOSAuth("sign-up");
      if (result) {
        // New user — navigate to onboarding
        router.replace("/onboarding");
      }
    } catch (err) {
      console.error("[SIGN_UP] Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center px-8">
        {/* Brand */}
        <View className="mb-12 items-center">
          <Text className="text-5xl font-serif text-foreground tracking-wider">
            NIMA
          </Text>
          <Text className="text-base text-muted-foreground mt-2 tracking-wide">
            Discover your personal style
          </Text>
        </View>

        {/* Sign-up button */}
        <Pressable
          onPress={handleSignUp}
          disabled={isLoading}
          className="w-full bg-primary py-4 rounded-lg items-center mb-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          {isLoading ? (
            <ActivityIndicator color="#FAF8F5" />
          ) : (
            <Text className="text-primary-foreground text-base font-sans font-semibold tracking-wide">
              Create Account
            </Text>
          )}
        </Pressable>

        {/* Sign-in link */}
        <Pressable
          onPress={() => router.push("/(auth)/sign-in")}
          disabled={isLoading}
          className="w-full border border-border py-4 rounded-lg items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Text className="text-foreground text-base font-sans tracking-wide">
            Already have an account? Sign In
          </Text>
        </Pressable>

        {/* Error display */}
        {error && (
          <Text className="text-destructive text-sm mt-4 text-center">
            {error}
          </Text>
        )}

        {/* Legal */}
        <Text className="text-text-muted text-xs text-center mt-8 px-4 leading-5">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}
