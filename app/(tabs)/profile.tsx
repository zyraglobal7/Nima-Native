import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import PagerView from "react-native-pager-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SettingsTab } from "@/components/profile/SettingsTab";
import { PhotosTab } from "@/components/profile/PhotosTab";
import { StyleFitTab } from "@/components/profile/StyleFitTab";
import { AccountTab } from "@/components/profile/AccountTab";
import { SwipeTutorial } from "@/components/profile/SwipeTutorial";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
// Re-export as Expo Router's route-level ErrorBoundary for this screen
export { RouteErrorBoundary as ErrorBoundary } from "@/components/ErrorBoundary";

const TABS = ["Settings", "Photos", "Style & Fit", "Account"] as const;
const TUTORIAL_KEY = "nima-profile-swipe-tutorial-seen";

export default function ProfileScreen() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const pagerRef = useRef<PagerView>(null);
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  // Check if swipe tutorial has been seen
  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_KEY).then((value) => {
      if (value !== "true") {
        setShowTutorial(true);
      }
    });
  }, []);

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    AsyncStorage.setItem(TUTORIAL_KEY, "true");
  }, []);

  const goToPage = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  if (isLoading || (isAuthenticated && currentUser === undefined)) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color="#A67C52" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-4 pt-4">
        <ProfileHeader onEdit={() => goToPage(3)} />

        {/* Tab bar */}
        <View className="flex-row bg-surface dark:bg-surface-dark p-1 rounded-xl mb-6">
          {TABS.map((label, index) => (
            <TabButton
              key={label}
              active={activeIndex === index}
              onPress={() => goToPage(index)}
              label={label}
            />
          ))}
        </View>

        {/* Swipeable tab content */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
        >
          <View key="settings" style={{ flex: 1 }}>
            <SettingsTab />
          </View>
          <View key="photos" style={{ flex: 1 }}>
            <PhotosTab />
          </View>
          <View key="style" style={{ flex: 1 }}>
            <StyleFitTab />
          </View>
          <View key="account" style={{ flex: 1 }}>
            <AccountTab />
          </View>
        </PagerView>
      </View>

      {/* First-time swipe tutorial overlay */}
      {showTutorial && <SwipeTutorial onDismiss={dismissTutorial} />}
    </SafeAreaView>
  );
}

function TabButton({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 items-center justify-center py-2.5 rounded-lg ${
        active ? "bg-background dark:bg-background-dark shadow-sm" : ""
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          active
            ? "text-foreground dark:text-foreground-dark"
            : "text-muted-foreground dark:text-muted-dark-foreground"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
