import React from "react";
import { View, Text, Pressable } from "react-native";
import { MapPin, Shield, Trash2 } from "lucide-react-native";

interface LocationPermissionScreenProps {
  onRequestPermission: () => void;
}

export function LocationPermissionScreen({
  onRequestPermission,
}: LocationPermissionScreenProps) {
  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      <View className="w-24 h-24 rounded-full bg-info/20 items-center justify-center mb-8">
        <MapPin size={48} color="#00d4ff" strokeWidth={1.5} />
      </View>

      <Text
        className="text-foreground text-3xl font-bold mb-4 text-center"
        style={{ fontFamily: "SpaceGrotesk_700Bold" }}
      >
        Location Access
      </Text>

      <Text className="text-muted text-center text-base mb-10 px-4 leading-6">
        VizinhoAlert needs your location to show nearby alerts and broadcast your
        alerts to neighbors in your area.
      </Text>

      <View className="w-full bg-border/30 rounded-xl p-6 mb-10">
        <Text
          className="text-foreground text-lg font-semibold mb-4"
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        >
          Privacy Commitment
        </Text>

        <View className="flex-row items-start mb-4">
          <Shield size={20} color="#00d4ff" className="mr-3 mt-0.5" />
          <View className="flex-1 ml-3">
            <Text className="text-foreground text-sm font-medium mb-1">
              Anonymous by Design
            </Text>
            <Text className="text-muted text-sm leading-5">
              No names, no emails, no phone numbers. Your device ID is the only
              identifier.
            </Text>
          </View>
        </View>

        <View className="flex-row items-start mb-4">
          <MapPin size={20} color="#00d4ff" className="mr-3 mt-0.5" />
          <View className="flex-1 ml-3">
            <Text className="text-foreground text-sm font-medium mb-1">
              Approximate Location Only
            </Text>
            <Text className="text-muted text-sm leading-5">
              We use general proximity, never your exact address.
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <Trash2 size={20} color="#00d4ff" className="mr-3 mt-0.5" />
          <View className="flex-1 ml-3">
            <Text className="text-foreground text-sm font-medium mb-1">
              Auto-Delete
            </Text>
            <Text className="text-muted text-sm leading-5">
              All alerts are automatically deleted after 30 days.
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onRequestPermission}
        className="bg-info w-full py-4 rounded-lg items-center"
      >
        <Text
          className="text-background font-bold text-base"
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        >
          Enable Location
        </Text>
      </Pressable>

      <Text
        className="text-muted text-xs text-center mt-4"
        style={{ fontFamily: "IBMPlexMono_400Regular" }}
      >
        GDPR compliant • EU-hosted infrastructure
      </Text>
    </View>
  );
}
