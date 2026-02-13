import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Settings, Image as ImageIcon, Shirt, User } from "lucide-react-native";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SettingsTab } from "@/components/profile/SettingsTab";
import { PhotosTab } from "@/components/profile/PhotosTab";
import { StyleFitTab } from "@/components/profile/StyleFitTab";
import { AccountTab } from "@/components/profile/AccountTab";
import { Redirect } from "expo-router";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NavigationContext } from "@react-navigation/core";

type Tab = "settings" | "photos" | "style" | "account";

export default function ProfileScreen() {
  // Guard against rendering before the navigation context is available.
  // This prevents the transient "Couldn't find a navigation context"
  // error that can happen during hot reload or initial mount.
  const navContext = useContext(NavigationContext);
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  if (!navContext || isLoading || (isAuthenticated && currentUser === undefined)) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color="#A67C52" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "settings":
        return <SettingsTab />;
      case "photos":
        return <PhotosTab />;
      case "style":
        return <StyleFitTab />;
      case "account":
        return <AccountTab />;
      default:
        return <SettingsTab />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-4 pt-4">
        <ProfileHeader onEdit={() => setActiveTab("account")} />

        <View className="flex-row bg-surface dark:bg-surface-dark p-1 rounded-xl mb-6">
          <TabButton
            active={activeTab === "settings"}
            onPress={() => setActiveTab("settings")}
            label="Settings"
          />
          <TabButton
            active={activeTab === "photos"}
            onPress={() => setActiveTab("photos")}
            label="Photos"
          />
          <TabButton
            active={activeTab === "style"}
            onPress={() => setActiveTab("style")}
            label="Style & Fit"
          />
          <TabButton
            active={activeTab === "account"}
            onPress={() => setActiveTab("account")}
            label="Account"
          />
        </View>

        <View className="flex-1">{renderContent()}</View>
      </View>
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
          active ? "text-foreground dark:text-foreground-dark" : "text-muted-foreground dark:text-muted-dark-foreground"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
