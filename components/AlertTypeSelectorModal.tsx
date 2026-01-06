import React from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { X } from "lucide-react-native";
import { AlertType, ALERT_TYPES } from "@/types/alerts";
import { AlertIcon } from "@/components/AlertIcon";

interface AlertTypeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: AlertType) => void;
}

const colorMap = {
  warning: "#ff9500",
  info: "#00d4ff",
  urgent: "#ff3b30",
};

const bgColorMap = {
  warning: "rgba(255, 149, 0, 0.1)",
  info: "rgba(0, 212, 255, 0.1)",
  urgent: "rgba(255, 59, 48, 0.1)",
};

const borderColorMap = {
  warning: "rgba(255, 149, 0, 0.3)",
  info: "rgba(0, 212, 255, 0.3)",
  urgent: "rgba(255, 59, 48, 0.3)",
};

export function AlertTypeSelectorModal({
  visible,
  onClose,
  onSelectType,
}: AlertTypeSelectorModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl pt-6 pb-10 px-4">
          <View className="flex-row items-center justify-between mb-6 px-2">
            <Text
              className="text-foreground text-2xl font-bold"
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            >
              Select Alert Type
            </Text>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-border"
            >
              <X size={20} color="#f4f1ea" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {ALERT_TYPES.map((alertType) => (
              <Pressable
                key={alertType.type}
                onPress={() => onSelectType(alertType.type)}
                className="w-[48%] mb-4 rounded-xl p-4 items-center justify-center"
                style={{
                  backgroundColor: bgColorMap[alertType.color],
                  borderWidth: 1,
                  borderColor: borderColorMap[alertType.color],
                  minHeight: 120,
                }}
              >
                <View className="mb-3">
                  <AlertIcon
                    icon={alertType.icon}
                    color={colorMap[alertType.color]}
                    size={32}
                  />
                </View>
                <Text
                  className="text-foreground text-center text-sm font-semibold"
                  style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                >
                  {alertType.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
