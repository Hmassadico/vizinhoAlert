import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_RADIUS_KM } from "@/types/alerts";

const RADIUS_KEY = "@vizinhoalert:radius";
const LOCATION_PERMISSION_KEY = "@vizinhoalert:location_permission";

export async function getRadius(): Promise<number> {
  const radius = await AsyncStorage.getItem(RADIUS_KEY);
  return radius ? parseFloat(radius) : DEFAULT_RADIUS_KM;
}

export async function setRadius(radius: number): Promise<void> {
  await AsyncStorage.setItem(RADIUS_KEY, radius.toString());
}

export async function hasGrantedLocationPermission(): Promise<boolean> {
  const granted = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);
  return granted === "true";
}

export async function setLocationPermissionGranted(granted: boolean): Promise<void> {
  await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, granted ? "true" : "false");
}

export function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const timestamp = new Date(dateString).getTime();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatCountdown(dateString: string): string {
  const now = Date.now();
  const expiresAt = new Date(dateString).getTime();
  const diff = expiresAt - now;
  
  if (diff <= 0) return "Expired";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days}d left`;
}
