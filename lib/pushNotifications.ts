import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import {
  registerPushToken,
  isPushTokenRegistered,
  setPushTokenRegistered,
} from "@/lib/api";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Check if we're running in Expo Go (which has push notification limitations)
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

async function getExpoPushToken(): Promise<string | null> {
  // Skip on non-physical devices
  if (!Device.isDevice) {
    console.log("[VizinhoAlert] Push notifications require a physical device");
    return null;
  }

  // Gracefully handle Expo Go limitations
  if (isExpoGo()) {
    console.log("[VizinhoAlert] Push notifications are limited in Expo Go. Use a development build for full functionality.");
    return null;
  }

  try {
    // Try to get projectId from multiple sources
    const projectId =
      (Constants as any).easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn("[VizinhoAlert] No EAS projectId found. Push notifications may not work correctly.");
    }

    // Get token with or without projectId
    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return token.data;
  } catch (error) {
    // Don't crash the app - just log and return null
    console.warn("[VizinhoAlert] Failed to get push token:", error);
    return null;
  }
}

export async function setupPushNotifications(): Promise<void> {
  // Skip push setup on web platform
  if (Platform.OS === "web") {
    console.log("[VizinhoAlert] Push notifications not supported on web");
    return;
  }

  // Skip in Expo Go to avoid crashes
  if (isExpoGo()) {
    console.log("[VizinhoAlert] Skipping push setup in Expo Go");
    return;
  }

  // Check if already registered
  const alreadyRegistered = await isPushTokenRegistered();
  if (alreadyRegistered) {
    return;
  }

  try {
    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[VizinhoAlert] Push notification permission denied");
      return;
    }

    // Get the push token
    const pushToken = await getExpoPushToken();
    if (!pushToken) {
      return;
    }

    // Register with backend
    const platform = Platform.OS as "ios" | "android";
    await registerPushToken(pushToken, platform);
    await setPushTokenRegistered(true);
    console.log("[VizinhoAlert] Push token registered successfully");
  } catch (error) {
    // Never crash the app due to push notification issues
    console.warn("[VizinhoAlert] Push notification setup failed (non-critical):", error);
  }
}
