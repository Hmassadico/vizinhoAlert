// Re-export alert type constants from single source of truth
export {
  AlertType,
  ALERT_TYPES,
  ALERT_TYPE_CONFIGS,
  AlertTypeConfig,
  normalizeAlertType,
  isAlertType,
  getAlertTypeConfig,
} from "@/lib/constants/alertTypes";

// Backward compatibility alias
import { ALERT_TYPE_CONFIGS as _CONFIGS } from "@/lib/constants/alertTypes";
export const ALERT_TYPES_CONFIG = _CONFIGS;

// Alert from backend API
export interface Alert {
  id: string;
  alert_type: string;
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
  // Auto-detected country from plate format
  country_code?: string | null;
  country_name?: string | null;
}

// QR code response from backend
export interface VehicleQR {
  qr_code_url: string;
  qr_code_data: string;
  vehicle_id: string;
}

export const ALERT_EXPIRY_DAYS = 30;
export const DEFAULT_RADIUS_KM = 2;
export const MIN_RADIUS_KM = 0.5;
export const MAX_RADIUS_KM = 5;
