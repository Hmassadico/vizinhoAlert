import React from "react";
import { View, Text } from "react-native";
import { Alert } from "@/types/alerts";
import { ALERT_TYPE_CONFIGS, normalizeAlertType } from "@/lib/constants/alertTypes";
import { AlertIcon } from "@/components/AlertIcon";
import { formatTimeAgo, formatCountdown } from "@/lib/storage";

interface AlertCardProps {
  alert: Alert;
}

const colorMap = {
  warning: "#ff9500",
  info: "#00d4ff",
  urgent: "#ff3b30",
};

const borderColorMap = {
  warning: "border-warning/30",
  info: "border-info/30",
  urgent: "border-urgent/30",
};

export function AlertCard({ alert }: AlertCardProps) {
  // Normalize the alert type to handle both uppercase and lowercase from backend
  const normalizedType = normalizeAlertType(alert.alert_type);
  const config = ALERT_TYPE_CONFIGS.find((t) => t.type === normalizedType);
  if (!config) return null;

  const color = colorMap[config.color];
  const borderClass = borderColorMap[config.color];

  return (
    <View
      className={`bg-background border ${borderClass} rounded-lg p-4 mb-4`}
      style={{ borderWidth: 1 }}
    >
      <View className="flex-row items-start">
        <View
          className="w-12 h-12 rounded-lg items-center justify-center mr-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <AlertIcon icon={config.icon} color={color} size={24} />
        </View>

        <View className="flex-1">
          <Text
            className="text-foreground text-lg font-semibold mb-1"
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          >
            {config.label}
          </Text>

          <View className="flex-row items-center gap-3">
            <Text
              className="text-muted text-xs"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              {formatTimeAgo(alert.created_at)}
            </Text>
            <Text className="text-muted text-xs">•</Text>
            <Text
              className="text-muted text-xs"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              {formatCountdown(alert.expires_at)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
