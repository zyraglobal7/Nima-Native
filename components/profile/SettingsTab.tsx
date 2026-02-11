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
import { Link, useRouter } from "expo-router";
import { signOut } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SettingsTab() {
  const { isDark, setTheme } = useTheme();
  const router = useRouter();
  const currentUser = useQuery(api.users.queries.getCurrentUser);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      {/* Settings Sections */}
      <View className="space-y-6 pb-20">
        {/* Appearance */}
        <View>
          <Text className="text-lg font-serif font-medium text-foreground mb-3">
            Appearance
          </Text>
          <View className="bg-surface rounded-xl overflow-hidden border border-border">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center space-x-3">
                {isDark ? (
                  <Moon size={20} className="text-foreground" />
                ) : (
                  <Sun size={20} className="text-foreground" />
                )}
                <Text className="text-base text-foreground font-sans">
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#E0D8CC", true: "#5C2A33" }}
                thumbColor={isDark ? "#FAF8F5" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* Your Activity */}
        <View>
          <Text className="text-lg font-serif font-medium text-foreground mb-3">
            Your Activity
          </Text>
          <View className="bg-surface rounded-xl overflow-hidden border border-border divide-y divide-border">
            <Link href="/profile/discarded-looks" asChild>
              <TouchableOpacity className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center space-x-3 flex-1">
                  <Trash2 size={24} className="text-foreground" />
                  <View>
                    <Text className="text-base font-medium text-foreground font-serif">
                      Discarded Looks
                    </Text>
                    <Text className="text-sm text-muted-foreground font-sans">
                      View and restore discarded looks
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </Link>

            <Link href="/orders" asChild>
              <TouchableOpacity className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center space-x-3 flex-1">
                  <ShoppingBag size={24} className="text-foreground" />
                  <View>
                    <Text className="text-base font-medium text-foreground font-serif">
                      My Orders
                    </Text>
                    <Text className="text-sm text-muted-foreground font-sans">
                      Track and manage your purchases
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} className="text-muted-foreground" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Account Settings */}
        <View>
          <Text className="text-lg font-serif font-medium text-foreground mb-3">
            Account Settings
          </Text>
          <View className="bg-surface rounded-xl overflow-hidden border border-border divide-y divide-border">
            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center space-x-3 flex-1">
                <Mail size={24} className="text-foreground" />
                <View>
                  <Text className="text-base font-medium text-foreground font-serif">
                    Change Email
                  </Text>
                  <Text className="text-sm text-muted-foreground font-sans">
                    {currentUser?.email || "No email set"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center space-x-3 flex-1">
                <Lock size={24} className="text-foreground" />
                <View>
                  <Text className="text-base font-medium text-foreground font-serif">
                    Change Password
                  </Text>
                  <Text className="text-sm text-muted-foreground font-sans">
                    Managed via Google Account
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignOut}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center space-x-3 flex-1">
                <LogOut size={24} className="text-destructive" />
                <View>
                  <Text className="text-base font-medium text-destructive font-serif">
                    Log Out
                  </Text>
                  <Text className="text-sm text-destructive-foreground/60 font-sans">
                    Sign out of your account
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} className="text-destructive/50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Limits / Usage */}
        <View className="bg-surface p-4 rounded-xl border border-border">
          <Text className="text-base font-medium text-foreground mb-2 font-serif">
            Daily Try-Ons
          </Text>
          <View className="h-2 bg-surface-alt rounded-full overflow-hidden mb-2">
            <View
              style={{
                width: `${Math.min(((currentUser?.dailyTryOnCount || 0) / (currentUser?.subscriptionTier === "free" ? 5 : 100)) * 100, 100)}%`,
              }}
              className="h-full bg-primary"
            />
          </View>
          <Text className="text-sm text-muted-foreground font-sans">
            {currentUser?.dailyTryOnCount || 0} /{" "}
            {currentUser?.subscriptionTier === "free" ? 5 : "Unlimited"} used
            today
          </Text>
          {currentUser?.subscriptionTier === "free" && (
            <TouchableOpacity className="mt-3 py-2 bg-background border border-primary rounded-lg items-center">
              <Text className="text-primary font-medium font-sans">
                Upgrade to Style Pass
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
