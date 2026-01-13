import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { Alert, AlertType, Vehicle, VehicleQR } from "@/types/alerts";

// Centralized API base URL configuration
// IMPORTANT: Always use HTTPS in production via https://api.vizinhoalert.eu
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.vizinhoalert.eu/api/v1";

// Verify HTTPS is being used in production
if (Platform.OS === "web" && API_BASE_URL.startsWith("http://")) {
  console.warn(
    "[VizinhoAlert] Mixed content warning: API is using HTTP but web requires HTTPS. " +
    "Set EXPO_PUBLIC_API_BASE_URL to use https://api.vizinhoalert.eu/api/v1"
  );
}

const DEVICE_ID_KEY = "vizinhoalert_device_id";
const JWT_TOKEN_KEY = "@vizinhoalert:jwt_token";
const DEVICE_UUID_KEY = "@vizinhoalert:device_uuid";
const PUSH_TOKEN_REGISTERED_KEY = "@vizinhoalert:push_token_registered";

// Check if we're in a mixed-content situation
function checkMixedContent(): void {
  if (Platform.OS === "web" && API_BASE_URL.startsWith("http://")) {
    console.warn(
      "[VizinhoAlert] API request may fail due to mixed content (HTTPS page calling HTTP API)"
    );
  }
}

// Device ID management - uses expo-crypto for RN compatibility
export async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate device ID using expo-crypto (works in RN runtime)
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    // Convert to hex string and make alphanumeric (remove dashes, slice to <= 64 chars)
    deviceId = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 64);
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function getJwtToken(): Promise<string | null> {
  return AsyncStorage.getItem(JWT_TOKEN_KEY);
}

export async function getDeviceUuid(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_UUID_KEY);
}

// Auth: Register device and get JWT
export async function registerDevice(
  deviceId: string,
  latitude?: number,
  longitude?: number
): Promise<{ access_token: string; device_uuid: string }> {
  checkMixedContent();
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id: deviceId,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Registration failed: ${response.status}`);
    }

    const data = await response.json();

    // Store JWT and device UUID
    await AsyncStorage.setItem(JWT_TOKEN_KEY, data.access_token);
    await AsyncStorage.setItem(DEVICE_UUID_KEY, data.device_uuid);

    return data;
  } catch (error) {
    // Provide helpful error message for network errors (common with mixed-content)
    if (Platform.OS === "web" && error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        "Device registration failed. This may be due to mixed content (HTTPS page calling HTTP API). " +
        "The API works on mobile devices. For web, the API needs to use HTTPS."
      );
    }
    throw error;
  }
}

// Ensure authenticated - register if needed
export async function ensureAuthenticated(
  latitude?: number,
  longitude?: number
): Promise<string> {
  let token = await getJwtToken();

  if (!token) {
    const deviceId = await getOrCreateDeviceId();
    const result = await registerDevice(deviceId, latitude, longitude);
    token = result.access_token;
  }

  return token;
}

// Helper to make authenticated requests
async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  checkMixedContent();
  
  const token = await ensureAuthenticated();

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // If unauthorized, try to re-register
    if (response.status === 401) {
      await AsyncStorage.removeItem(JWT_TOKEN_KEY);
      const newToken = await ensureAuthenticated();

      return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
          "Content-Type": "application/json",
        },
      });
    }

    return response;
  } catch (error) {
    // Provide helpful error message for network errors (common with mixed-content)
    if (Platform.OS === "web" && error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        "Network request failed. This may be due to mixed content (HTTPS page calling HTTP API). " +
        "The API works on mobile devices. For web, the API needs to use HTTPS."
      );
    }
    throw error;
  }
}

// Alerts API
export async function fetchMyAlerts(): Promise<Alert[]> {
  const response = await authFetch("/alerts");

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.status}`);
  }

  const data = await response.json();
  return data.alerts || [];
}

export async function createAlert(
  vehicleQrToken: string,
  alertType: AlertType,
  latitude: number,
  longitude: number
): Promise<Alert> {
  const response = await authFetch("/alerts", {
    method: "POST",
    body: JSON.stringify({
      vehicle_qr_token: vehicleQrToken,
      alert_type: alertType,
      latitude,
      longitude,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to create alert: ${response.status}`);
  }

  return response.json();
}

// Vehicles API
export async function fetchMyVehicles(): Promise<Vehicle[]> {
  const response = await authFetch("/vehicles");

  if (!response.ok) {
    throw new Error(`Failed to fetch vehicles: ${response.status}`);
  }

  return response.json();
}

export async function registerVehicle(
  vehicleId: string,
  nickname?: string
): Promise<Vehicle> {
  const response = await authFetch("/vehicles", {
    method: "POST",
    body: JSON.stringify({
      vehicle_id: vehicleId,
      nickname,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to register vehicle: ${response.status}`);
  }

  return response.json();
}

export async function fetchVehicleQR(vehicleId: string): Promise<VehicleQR> {
  const response = await authFetch(`/vehicles/${vehicleId}/qr`);

  if (!response.ok) {
    throw new Error(`Failed to fetch QR code: ${response.status}`);
  }

  return response.json();
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const response = await authFetch(`/vehicles/${vehicleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete vehicle: ${response.status}`);
  }
}

// Update device location
export async function updateDeviceLocation(
  latitude: number,
  longitude: number,
  alertRadiusKm?: number
): Promise<void> {
  const response = await authFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({
      latitude,
      longitude,
      alert_radius_km: alertRadiusKm,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update location: ${response.status}`);
  }
}

// Push notifications API
export async function registerPushToken(
  token: string,
  platform: "ios" | "android"
): Promise<void> {
  const response = await authFetch("/push/token", {
    method: "POST",
    body: JSON.stringify({
      token,
      platform,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to register push token: ${response.status}`);
  }
}

export async function isPushTokenRegistered(): Promise<boolean> {
  const registered = await AsyncStorage.getItem(PUSH_TOKEN_REGISTERED_KEY);
  return registered === "true";
}

export async function setPushTokenRegistered(registered: boolean): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, registered ? "true" : "false");
}
