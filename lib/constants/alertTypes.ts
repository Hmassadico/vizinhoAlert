/**
 * Alert Types - Single Source of Truth
 * These values MUST match the backend Postgres enum exactly (lowercase)
 */

// The canonical list of alert types - lowercase to match DB enum
export const ALERT_TYPES = [
  "lights_on",
  "window_open",
  "alarm_triggered",
  "parking_issue",
  "damage_spotted",
  "towing_risk",
  "obstruction",
  "general",
] as const;

// TypeScript type derived from the array
export type AlertType = (typeof ALERT_TYPES)[number];

// Mapping from possible uppercase/mixed-case inputs to lowercase DB values
const ALERT_TYPE_MAP: Record<string, AlertType> = {
  // Lowercase (canonical)
  lights_on: "lights_on",
  window_open: "window_open",
  alarm_triggered: "alarm_triggered",
  parking_issue: "parking_issue",
  damage_spotted: "damage_spotted",
  towing_risk: "towing_risk",
  obstruction: "obstruction",
  general: "general",
  // UPPERCASE enum-style (legacy fallback)
  LIGHTS_ON: "lights_on",
  WINDOW_OPEN: "window_open",
  ALARM_TRIGGERED: "alarm_triggered",
  PARKING_ISSUE: "parking_issue",
  DAMAGE_SPOTTED: "damage_spotted",
  TOWING_RISK: "towing_risk",
  OBSTRUCTION: "obstruction",
  GENERAL: "general",
};

/**
 * Normalize alert type to lowercase DB-compatible format
 * Handles uppercase enum-style values, mixed case, and whitespace
 */
export function normalizeAlertType(input: string): AlertType {
  const trimmed = input.trim();
  
  // Check direct mapping first (handles uppercase enum values)
  if (trimmed in ALERT_TYPE_MAP) {
    return ALERT_TYPE_MAP[trimmed];
  }
  
  // Try lowercase conversion
  const lower = trimmed.toLowerCase() as AlertType;
  if (ALERT_TYPES.includes(lower)) {
    return lower;
  }
  
  // Default to general if unknown
  console.warn(`[VizinhoAlert] Unknown alert type "${input}", defaulting to "general"`);
  return "general";
}

/**
 * Type guard to check if a string is a valid AlertType
 */
export function isAlertType(x: string): x is AlertType {
  return ALERT_TYPES.includes(x.toLowerCase() as AlertType);
}

/**
 * Alert type configuration for UI display
 */
export interface AlertTypeConfig {
  type: AlertType;
  label: string;
  icon: string;
  color: "warning" | "info" | "urgent";
}

/**
 * Alert types with UI metadata
 */
export const ALERT_TYPE_CONFIGS: AlertTypeConfig[] = [
  { type: "lights_on", label: "Lights On", icon: "lightbulb", color: "warning" },
  { type: "window_open", label: "Window Open", icon: "square", color: "info" },
  { type: "alarm_triggered", label: "Alarm Triggered", icon: "siren", color: "urgent" },
  { type: "parking_issue", label: "Parking Issue", icon: "parking-circle", color: "warning" },
  { type: "damage_spotted", label: "Damage Spotted", icon: "alert-triangle", color: "urgent" },
  { type: "towing_risk", label: "Towing Risk", icon: "truck", color: "urgent" },
  { type: "obstruction", label: "Obstruction", icon: "ban", color: "warning" },
  { type: "general", label: "General Alert", icon: "bell", color: "info" },
];

/**
 * Get config for an alert type
 */
export function getAlertTypeConfig(type: AlertType): AlertTypeConfig | undefined {
  return ALERT_TYPE_CONFIGS.find((config) => config.type === type);
}
