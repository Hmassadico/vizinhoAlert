import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { CheckCircle } from "lucide-react-native";
import { AlertType, ALERT_TYPE_CONFIGS } from "@/lib/constants/alertTypes";

interface BroadcastSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  alertType: AlertType | null;
}

export function BroadcastSuccessModal({
  visible,
  onClose,
  alertType,
}: BroadcastSuccessModalProps) {
  const config = alertType ? ALERT_TYPE_CONFIGS.find((t) => t.type === alertType) : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        <View className="bg-background rounded-2xl p-8 w-full max-w-sm items-center border border-border">
          <View className="w-20 h-20 rounded-full bg-info/20 items-center justify-center mb-6">
            <CheckCircle size={48} color="#00d4ff" strokeWidth={1.5} />
          </View>

          <Text
            className="text-foreground text-2xl font-bold mb-2 text-center"
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          >
            Alert Sent
          </Text>

          <Text className="text-muted text-center mb-6">
            The vehicle owner has been notified
          </Text>

          {config && (
            <View className="bg-border/50 rounded-lg p-4 w-full mb-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-sm">Alert Type</Text>
                <Text
                  className="text-foreground text-sm font-semibold"
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                >
                  {config.label}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={onClose}
            className="bg-info w-full py-4 rounded-lg items-center"
          >
            <Text
              className="text-background font-bold text-base"
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
