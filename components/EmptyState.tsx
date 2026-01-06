import React from "react";
import { View, Text } from "react-native";
import { Bell } from "lucide-react-native";

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <View className="w-20 h-20 rounded-full bg-border/50 items-center justify-center mb-6">
        <Bell size={36} color="#6b7280" strokeWidth={1.5} />
      </View>

      <Text
        className="text-foreground text-xl font-bold mb-3 text-center"
        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
      >
        No Alerts Yet
      </Text>

      <Text className="text-muted text-center text-base mb-4">
        Alerts about your vehicles will appear here when neighbors scan your QR code.
      </Text>

      <Text className="text-muted text-center text-sm">
        Register a vehicle and print the QR code to place on your car.
      </Text>
    </View>
  );
}
