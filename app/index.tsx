import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { GateSplash } from "@/components/landing/GateSplash";
import { useOnboardingCompletion } from "@/lib/hooks/useOnboardingCompletion";
import { Loader } from "@/components/ui/Loader";

// -------- Components --------

function AuthenticatedContent() {
  const router = useRouter();
  const { isProcessing, error, needsOnboarding, completed } =
    useOnboardingCompletion();

  useEffect(() => {
    if (completed && !needsOnboarding && !isProcessing) {
      // Redirect to main feed if onboarding is complete
      router.replace("/(tabs)/discover");
    }
  }, [completed, needsOnboarding, isProcessing, router]);

  // Show loading while processing user state
  if (isProcessing) {
    return <Loader message="Setting up your profile..." />;
  }

  // Show error if failed
  // TODO: Add a nice Error component
  if (error) {
    return <Loader message={`Error: ${error}`} />;
  }

  // If user needs onboarding
  if (needsOnboarding) {
    // Navigate to onboarding screen
    // We wrapping in useEffect to avoid update loop during render
    useEffect(() => {
      router.replace("/onboarding");
    }, []);
    return <Loader message="Redirecting to onboarding..." />;
  }

  // Fallback loading while redirect happens
  return <Loader message="Taking you to your feed..." />;
}

export default function Index() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Loading State */}
      <AuthLoading>
        <Loader />
      </AuthLoading>

      {/* Authenticated State */}
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>

      {/* Unauthenticated State - Show GateSplash */}
      <Unauthenticated>
        <GateSplash onGetStarted={handleGetStarted} />
      </Unauthenticated>
    </View>
  );
}
