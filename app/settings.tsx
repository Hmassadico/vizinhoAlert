import React, { useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Shield, Trash2, Info, Car } from "lucide-react-native";

import { getOrCreateDeviceId } from "@/lib/api";
import { ALERT_EXPIRY_DAYS } from "@/types/alerts";

export default function SettingsScreen() {
  const [deviceId, setDeviceId] = useState<string>("");

  const loadSettings = useCallback(async () => {
    const id = await getOrCreateDeviceId();
    setDeviceId(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView className="flex-1 px-4 pt-6">
        {/* Privacy Info */}
        <View className="mb-8">
          <Text
            className="text-foreground text-lg font-semibold mb-4"
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          >
            Privacy & Data
          </Text>

          <View className="bg-border/30 rounded-xl p-5">
            <View className="flex-row items-start mb-5">
              <Shield size={20} color="#00d4ff" />
              <View className="flex-1 ml-3">
                <Text className="text-foreground text-sm font-medium mb-1">
                  Anonymous Device ID
                </Text>
                <Text
                  className="text-muted text-xs"
                  style={{ fontFamily: "IBMPlexMono_400Regular" }}
                >
                  {deviceId.substring(0, 8)}...{deviceId.substring(deviceId.length - 4)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-5">
              <Car size={20} color="#00d4ff" />
              <View className="flex-1 ml-3">
                <Text className="text-foreground text-sm font-medium mb-1">
                  Vehicle IDs Are Hashed
                </Text>
                <Text className="text-muted text-sm">
                  Your license plate is never stored - only a one-way hash
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-5">
              <Trash2 size={20} color="#00d4ff" />
              <View className="flex-1 ml-3">
                <Text className="text-foreground text-sm font-medium mb-1">
                  Auto-Delete Policy
                </Text>
                <Text className="text-muted text-sm">
                  Alerts are automatically deleted after {ALERT_EXPIRY_DAYS} days
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Info size={20} color="#00d4ff" />
              <View className="flex-1 ml-3">
                <Text className="text-foreground text-sm font-medium mb-1">
                  No Personal Data Collected
                </Text>
                <Text className="text-muted text-sm">
                  No names, emails, or phone numbers are stored
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* About */}
        <View className="mb-8">
          <Text
            className="text-foreground text-lg font-semibold mb-4"
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          >
            About
          </Text>

          <View className="bg-border/30 rounded-xl p-5">
            <Text
              className="text-foreground text-xl font-bold mb-2"
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            >
              VizinhoAlert
            </Text>
            <Text className="text-muted text-sm mb-4">
              Privacy-first car alert system. Get notified when neighbors spot something with your vehicle.
            </Text>

            <View className="border-t border-border pt-4">
              <Text
                className="text-muted text-xs text-center"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                GDPR compliant • EU-hosted infrastructure
              </Text>
              <Text
                className="text-muted text-xs text-center mt-1"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                Version 1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
