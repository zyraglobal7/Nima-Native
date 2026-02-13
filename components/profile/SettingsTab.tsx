import React from "react";
import { View, Text, Switch, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "@/lib/contexts/ThemeContext";
import {
  Moon,
  Sun,
  Trash2,
  ChevronRight,
  Mail,
  Lock,
  LogOut,
  ShoppingBag,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { signOut } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Platform } from "react-native";

export function SettingsTab() {
  const { isDark, setTheme } = useTheme();
  const router = useRouter();
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleSignOut = async () => {
    await signOut();

    // On web, we need a page reload to clear Convex state
    // On native, router.replace works fine after token is cleared
    if (Platform.OS === "web") {
      // Force a full page reload on web to clear all state
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } else {
      // On native, small delay to ensure Convex detects the token change
      setTimeout(() => {
        router.replace("/");
      }, 100);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      showsVerticalScrollIndicator={false}
    >
      {/* Settings Sections */}
      <View className="space-y-6 pb-20">
        {/* Appearance */}
        <View>
          <Text className="text-lg font-serif font-medium text-foreground dark:text-foreground-dark mb-3">
            Appearance
          </Text>
          <View className="bg-surface dark:bg-surface-dark rounded-xl overflow-hidden border border-border dark:border-border-dark">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center space-x-3">
                {isDark ? (
                  <Moon size={20} className="text-foreground dark:text-foreground-dark" />
                ) : (
                  <Sun size={20} className="text-foreground dark:text-foreground-dark" />
                )}
                <Text className="text-base text-foreground dark:text-foreground-dark font-sans">
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#E0D8CC", true: "#C9A07A" }}
                thumbColor={isDark ? "#1A1614" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* Your Activity */}
        <View>
          <Text className="text-lg font-serif font-medium text-foreground dark:text-foreground-dark mb-3">
            Your Activity
          </Text>
          <View className="bg-surface dark:bg-surface-dark rounded-xl overflow-hidden border border-border dark:border-border-dark divide-y divide-border dark:divide-border-dark">
            <TouchableOpacity
              onPress={() => router.push("/profile/discarded-looks")}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center space-x-3 flex-1">
                <Trash2 size={24} className="text-foreground dark:text-foreground-dark" />
                <View>
                  <Text className="text-base font-medium text-foreground dark:text-foreground-dark font-serif">
                    Discarded Looks
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-dark-foreground font-sans">
                    View and restore discarded looks
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-muted-foreground dark:text-muted-dark-foreground" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/orders")}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center space-x-3 flex-1">
                <ShoppingBag size={24} className="text-foreground dark:text-foreground-dark" />
                <View>
                  <Text className="text-base font-medium text-foreground dark:text-foreground-dark font-serif">
                    My Orders
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-dark-foreground font-sans">
                    Track and manage your purchases
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-muted-foreground dark:text-muted-dark-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings */}
        <View>
          <Text className="text-lg font-serif font-medium text-foreground dark:text-foreground-dark mb-3">
            Account Settings
          </Text>
          <View className="bg-surface dark:bg-surface-dark rounded-xl overflow-hidden border border-border dark:border-border-dark divide-y divide-border dark:divide-border-dark">
            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center space-x-3 flex-1">
                <Mail size={24} className="text-foreground dark:text-foreground-dark" />
                <View>
                  <Text className="text-base font-medium text-foreground dark:text-foreground-dark font-serif">
                    Change Email
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-dark-foreground font-sans">
                    {currentUser?.email || "No email set"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-muted-foreground dark:text-muted-dark-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center space-x-3 flex-1">
                <Lock size={24} className="text-foreground dark:text-foreground-dark" />
                <View>
                  <Text className="text-base font-medium text-foreground dark:text-foreground-dark font-serif">
                    Change Password
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-dark-foreground font-sans">
                    Managed via Google Account
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-muted-foreground dark:text-muted-dark-foreground" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignOut}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center space-x-3 flex-1">
                <LogOut size={24} className="text-destructive dark:text-destructive-dark" />
                <View>
                  <Text className="text-base font-medium text-destructive dark:text-destructive-dark font-serif">
                    Log Out
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-muted-dark-foreground font-sans">
                    Sign out of your account
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-muted-foreground dark:text-muted-dark-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Limits / Usage */}
        <View className="bg-surface dark:bg-surface-dark p-4 rounded-xl border border-border dark:border-border-dark">
          <Text className="text-base font-medium text-foreground dark:text-foreground-dark mb-2 font-serif">
            Daily Try-Ons
          </Text>
          <View className="h-2 bg-surface-alt dark:bg-surface-alt-dark rounded-full overflow-hidden mb-2">
            <View
              style={{
                width: `${Math.min(((currentUser?.dailyTryOnCount || 0) / (currentUser?.subscriptionTier === "free" ? 5 : 100)) * 100, 100)}%`,
              }}
              className="h-full bg-primary dark:bg-primary-dark"
            />
          </View>
          <Text className="text-sm text-muted-foreground dark:text-muted-dark-foreground font-sans">
            {currentUser?.dailyTryOnCount || 0} /{" "}
            {currentUser?.subscriptionTier === "free" ? 5 : "Unlimited"} used
            today
          </Text>
          {currentUser?.subscriptionTier === "free" && (
            <TouchableOpacity className="mt-3 py-2 bg-background dark:bg-background-dark border border-primary dark:border-primary-dark rounded-lg items-center">
              <Text className="text-primary dark:text-primary-dark font-medium font-sans">
                Upgrade to Style Pass
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
