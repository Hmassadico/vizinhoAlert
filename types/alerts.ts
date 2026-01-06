// Alert types matching backend: lights_on, window_open, alarm_triggered, parking_issue, damage_spotted, towing_risk, obstruction, general
export type AlertType =
  | "lights_on"
  | "window_open"
  | "alarm_triggered"
  | "parking_issue"
  | "damage_spotted"
  | "towing_risk"
  | "obstruction"
  | "general";

// Alert from backend API
export interface Alert {
  id: string;
  alert_type: AlertType;
  latitude: number;
  longitude: number;
  created_at: string;
  expires_at: string;
  notification_sent: string | null;
}

// Vehicle from backend API
export interface Vehicle {
  id: string;
  qr_code_token: string;
  nickname: string | null;
  is_active: boolean;
  created_at: string;
}

// QR code response from backend
export interface VehicleQR {
  qr_code_url: string;
  qr_code_data: string;
  vehicle_id: string;
}

export interface AlertTypeConfig {
  type: AlertType;
  label: string;
  icon: string;
  color: "warning" | "info" | "urgent";
}

export const ALERT_TYPES: AlertTypeConfig[] = [
  { type: "lights_on", label: "Lights On", icon: "lightbulb", color: "warning" },
  { type: "window_open", label: "Window Open", icon: "square", color: "info" },
  { type: "alarm_triggered", label: "Alarm Triggered", icon: "siren", color: "urgent" },
  { type: "parking_issue", label: "Parking Issue", icon: "parking-circle", color: "warning" },
  { type: "damage_spotted", label: "Damage Spotted", icon: "alert-triangle", color: "urgent" },
  { type: "towing_risk", label: "Towing Risk", icon: "truck", color: "urgent" },
  { type: "obstruction", label: "Obstruction", icon: "ban", color: "warning" },
  { type: "general", label: "General Alert", icon: "bell", color: "info" },
];

export const ALERT_EXPIRY_DAYS = 30;
export const DEFAULT_RADIUS_KM = 2;
export const MIN_RADIUS_KM = 0.5;
export const MAX_RADIUS_KM = 5;
