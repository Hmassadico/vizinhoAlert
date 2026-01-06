import React from "react";
import { View, Text, Pressable, Linking, Platform } from "react-native";
import { MapPinOff } from "lucide-react-native";

export function PermissionDeniedScreen() {
  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      <View className="w-24 h-24 rounded-full bg-urgent/20 items-center justify-center mb-8">
        <MapPinOff size={48} color="#ff3b30" strokeWidth={1.5} />
      </View>

      <Text
        className="text-foreground text-3xl font-bold mb-4 text-center"
        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
      >
        Location Required
      </Text>

      <Text className="text-muted text-center text-base mb-10 px-4 leading-6">
        VizinhoAlert requires location access to function. Without it, we can't
        show you nearby alerts or allow you to warn your neighbors.
      </Text>

      <Pressable
        onPress={openSettings}
        className="bg-info w-full py-4 rounded-lg items-center mb-4"
      >
        <Text
          className="text-background font-bold text-base"
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        >
          Open Settings
        </Text>
      </Pressable>

      <Text className="text-muted text-sm text-center">
        Grant location permission in your device settings to continue
      </Text>
    </View>
  );
}
