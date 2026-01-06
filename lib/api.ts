import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { Alert, AlertType, Vehicle, VehicleQR } from "@/types/alerts";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL is not set. Please add it to your .env file or environment variables."
  );
}

const DEVICE_ID_KEY = "@vizinhoalert:device_id";
const JWT_TOKEN_KEY = "@vizinhoalert:jwt_token";
const DEVICE_UUID_KEY = "@vizinhoalert:device_uuid";
const PUSH_TOKEN_REGISTERED_KEY = "@vizinhoalert:push_token_registered";

// Device ID management
export async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
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
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_id: deviceId,
      latitude,
      longitude,
    }),
  });

  if (!response.ok) {
    throw new Error(`Registration failed: ${response.status}`);
  }

  const data = await response.json();

  // Store JWT and device UUID
  await AsyncStorage.setItem(JWT_TOKEN_KEY, data.access_token);
  await AsyncStorage.setItem(DEVICE_UUID_KEY, data.device_uuid);

  return data;
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
  const token = await ensureAuthenticated();

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
