import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "expo-router";

/**
 * Configure notification handler — show notifications even when the app is foregrounded
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Set up Android notification channels
 */
async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#5C2A33",
    });
    await Notifications.setNotificationChannelAsync("credits", {
      name: "Credits",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#5C2A33",
    });
    await Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#5C2A33",
    });
    await Notifications.setNotificationChannelAsync("looks", {
      name: "Looks & Try-Ons",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#5C2A33",
    });
  }
}

/**
 * Register for push notifications and return the Expo push token
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications don't work on simulators
  if (!Device.isDevice) {
    console.log("[PUSH] Must use physical device for push notifications");
    return null;
  }

  // Set up channels on Android
  await setupNotificationChannels();

  // Check existing permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask for permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[PUSH] Permission not granted for push notifications");
    return null;
  }

  // Get the push token
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log("[PUSH] No EAS project ID found, skipping token registration");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("[PUSH] Expo push token:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error("[PUSH] Error getting push token:", error);
    return null;
  }
}

/**
 * Hook to manage push notification registration and handle incoming notifications
 *
 * - Registers for push notifications on mount
 * - Saves the token to Convex for server-side sending
 * - Listens for received and tapped notifications
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const router = useRouter();

  const savePushToken = useMutation(api.notifications.mutations.savePushToken);

  useEffect(() => {
    // Register and save token
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);

        // Save to Convex
        try {
          const platform =
            Platform.OS === "ios"
              ? ("ios" as const)
              : Platform.OS === "android"
                ? ("android" as const)
                : ("web" as const);
          await savePushToken({ token, platform });
        } catch (error) {
          console.error("[PUSH] Failed to save push token to Convex:", error);
        }
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // Listen for user tapping on a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("[PUSH] Notification tapped:", data);

        // Handle navigation based on notification type
        if (data?.type === "low_credits" || data?.type === "credits_purchased") {
          // Navigate to profile where credits are visible
          router.push("/(tabs)/profile");
        } else if (data?.type === "message_received") {
          // Navigate to messages
          router.push("/messages");
        } else if (data?.type === "look_ready" && data?.lookId) {
          // Navigate to the specific look
          router.push(`/look/${data.lookId}`);
        } else if (data?.type === "tryon_ready") {
          // Navigate to discover page (try-ons are visible there)
          router.push("/(tabs)/discover");
        } else if (data?.type === "onboarding_looks_ready") {
          // Navigate to discover page to see first looks
          router.push("/(tabs)/discover");
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

