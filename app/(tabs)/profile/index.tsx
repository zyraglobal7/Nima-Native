import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SettingsTab } from "@/components/profile/SettingsTab";
import { PhotosTab } from "@/components/profile/PhotosTab";
import { StyleFitTab } from "@/components/profile/StyleFitTab";
import { AccountTab } from "@/components/profile/AccountTab";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTheme } from "@/lib/contexts/ThemeContext";

const TABS = ["Settings", "Photos", "Style & Fit", "Account"] as const;
type TabLabel = (typeof TABS)[number];

export default function ProfileScreen() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const goToPage = useCallback((index: number) => {
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

        {/* Tab content */}
        <View className="flex-1">
          {activeIndex === 0 && <SettingsTab />}
          {activeIndex === 1 && <PhotosTab />}
          {activeIndex === 2 && <StyleFitTab />}
          {activeIndex === 3 && <AccountTab />}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Uses inline `style` instead of `className`. NativeWind's className interop on
// TouchableOpacity throws "Couldn't find a navigation context" when the
// className string changes on re-render — switching to style sidesteps it.
function TabButton({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: TabLabel;
}) {
  const { isDark } = useTheme();
  const activeBg = isDark ? "#1A1614" : "#FAF8F5";
  const activeFg = isDark ? "#F5F0E8" : "#2D2926";
  const mutedFg = isDark ? "#8C8078" : "#6B635B";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: active ? activeBg : "transparent",
        shadowColor: active ? "#000" : "transparent",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: active ? 0.05 : 0,
        shadowRadius: 2,
        elevation: active ? 1 : 0,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: active ? activeFg : mutedFg,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
