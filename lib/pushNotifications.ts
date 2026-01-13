import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

import {
  registerPushToken,
  isPushTokenRegistered,
  setPushTokenRegistered,
} from "@/lib/api";

/**
 * Check if we're running in Expo Go (which has push notification limitations in SDK 53+)
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/**
 * Lazy-load expo-notifications to avoid module-level import issues in Expo Go
 */
async function getNotificationsModule() {
  return await import("expo-notifications");
}

async function getExpoPushToken(): Promise<string | null> {
  // Skip on non-physical devices
  if (!Device.isDevice) {
    console.log("[VizinhoAlert] Push notifications require a physical device");
    return null;
  }

  // Gracefully handle Expo Go limitations (SDK 53+ removed remote push from Expo Go)
  if (isExpoGo()) {
    console.log("[VizinhoAlert] Push notifications are limited in Expo Go (SDK 53+). Use a development build for full functionality.");
    return null;
  }

  try {
    // Lazy import to avoid crashes in Expo Go
    const Notifications = await getNotificationsModule();
    
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

  // Skip in Expo Go to avoid crashes (SDK 53+ limitation)
  if (isExpoGo()) {
    if (Platform.OS === "android") {
      console.warn("[VizinhoAlert] Remote push notifications are not available in Expo Go on Android (SDK 53+). Create a development build for push functionality.");
    } else {
      console.log("[VizinhoAlert] Skipping push setup in Expo Go");
    }
    return;
  }

  // Check if already registered
  const alreadyRegistered = await isPushTokenRegistered();
  if (alreadyRegistered) {
    return;
  }

  try {
    // Lazy import notifications module
    const Notifications = await getNotificationsModule();
    
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

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
