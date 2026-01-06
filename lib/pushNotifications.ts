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

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  try {
    // Try to get projectId from multiple sources
    const projectId =
      (Constants as any).easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    // Get token with or without projectId
    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return token.data;
  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
}

export async function setupPushNotifications(): Promise<void> {
  // Check if already registered
  const alreadyRegistered = await isPushTokenRegistered();
  if (alreadyRegistered) {
    return;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return;
  }

  // Get the push token
  const pushToken = await getExpoPushToken();
  if (!pushToken) {
    return;
  }

  // Register with backend
  try {
    const platform = Platform.OS as "ios" | "android";
    await registerPushToken(pushToken, platform);
    await setPushTokenRegistered(true);
    console.log("Push token registered successfully");
  } catch (error) {
    console.error("Failed to register push token with backend:", error);
  }
}
