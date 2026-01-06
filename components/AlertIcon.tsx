import React from "react";
import {
  Lightbulb,
  Square,
  Siren,
  ParkingCircle,
  AlertTriangle,
  Truck,
  Ban,
  Bell,
  LucideIcon,
} from "lucide-react-native";

const iconMap: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  square: Square,
  siren: Siren,
  "parking-circle": ParkingCircle,
  "alert-triangle": AlertTriangle,
  truck: Truck,
  ban: Ban,
  bell: Bell,
};

interface AlertIconProps {
  icon: string;
  color: string;
  size?: number;
}

export function AlertIcon({ icon, color, size = 24 }: AlertIconProps) {
  const IconComponent = iconMap[icon] || Bell;
  return <IconComponent size={size} color={color} strokeWidth={2} />;
}
