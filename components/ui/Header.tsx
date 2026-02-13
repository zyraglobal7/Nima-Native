import React from "react";
import { View, TouchableOpacity, SafeAreaView, Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import {
  Sparkles,
  ArrowLeft,
  ShoppingBag,
  MessageSquare,
  Activity,
  Clock,
} from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useTheme();

  // Define root routes that show the Logo instead of Back button
  const isRootPage =
    pathname === "/discover" ||
    pathname === "/ask" ||
    pathname === "/lookbooks" ||
    pathname === "/orders" ||
    pathname === "/profile";

  // Don't show header on login/splash screens if they are part of the stack
  // But usually those are modals or have headerShown: false in layout

  const isAskPage = pathname === "/ask";
  const iconColor = isDark ? "#FAF8F5" : "#1A1614";

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/discover");
    }
  };

  return (
    <SafeAreaView className="bg-background dark:bg-background-dark border-b border-border/50 dark:border-border-dark/50 z-50">
      <View
        className={cn(
          "flex-row items-center justify-between px-4 py-3",
          Platform.OS === "android" && "pt-10", // Safe area adjustment for Android if not handled by SafeAreaView
        )}
      >
        {/* Left Section: Logo or Back Button */}
        <View className="flex-row items-center">
          {isRootPage ? (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/discover")}
              className="flex-row items-center gap-2"
            >
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                <Sparkles size={16} color="#FAF8F5" />
              </View>
              <Text variant="h4" className="font-semibold">
                Nima
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleBack}
              className="p-2 -ml-2 rounded-full active:bg-muted/10"
            >
              <ArrowLeft size={24} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Section: Actions */}
        <View className="flex-row items-center gap-3">
          {isAskPage ? (
            /* On Ask tab: only show chat history icon */
            <TouchableOpacity
              className="p-2 -mr-2 rounded-full active:bg-muted/10"
              onPress={() => {
                // Dispatch a custom event the Ask screen listens to
                // to open its ChatHistoryDrawer
                if (typeof globalThis.__openChatHistory === "function") {
                  globalThis.__openChatHistory();
                }
              }}
            >
              <Clock size={24} color={iconColor} />
            </TouchableOpacity>
          ) : (
            <>
              <ThemeToggle />

              <TouchableOpacity
                className="p-2 -mr-2 rounded-full active:bg-muted/10"
                onPress={() => router.push("/activity")}
              >
                <Activity size={24} color={iconColor} />
              </TouchableOpacity>

              <TouchableOpacity
                className="p-2 -mr-2 rounded-full active:bg-muted/10"
                onPress={() => router.push("/messages")}
              >
                <MessageSquare size={24} color={iconColor} />
              </TouchableOpacity>

              <TouchableOpacity
                className="p-2 -mr-2 rounded-full active:bg-muted/10"
                onPress={() => router.push("/cart")}
              >
                <ShoppingBag size={24} color={iconColor} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
