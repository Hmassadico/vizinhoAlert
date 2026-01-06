import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Settings, QrCode, Car } from "lucide-react-native";

import { Alert } from "@/types/alerts";
import {
  ensureAuthenticated,
  fetchMyAlerts,
} from "@/lib/api";
import { setupPushNotifications } from "@/lib/pushNotifications";
import { AlertCard } from "@/components/AlertCard";
import { EmptyState } from "@/components/EmptyState";

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnims = React.useRef<Animated.Value[]>([]).current;

  const loadAlerts = async () => {
    try {
      // Ensure authenticated (no location required for inbox)
      await ensureAuthenticated();

      // Setup push notifications (runs once per device)
      await setupPushNotifications();

      // Fetch alerts from backend
      const apiAlerts = await fetchMyAlerts();
      setAlerts(apiAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    // Initialize fade animations for stagger effect
    if (alerts.length > fadeAnims.length) {
      for (let i = fadeAnims.length; i < alerts.length; i++) {
        fadeAnims.push(new Animated.Value(0));
      }
    }

    // Stagger fade-in animation
    const animations = alerts.map((_, index) =>
      Animated.timing(fadeAnims[index], {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start();
  }, [alerts]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <View>
            <Text
              className="text-foreground text-2xl font-bold"
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            >
              VizinhoAlert
            </Text>
            <Text
              className="text-muted text-xs"
              style={{ fontFamily: "IBMPlexMono_400Regular" }}
            >
              Your Vehicle Alerts
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/settings")}
            className="w-10 h-10 rounded-full bg-border items-center justify-center"
          >
            <Settings size={20} color="#f4f1ea" />
          </Pressable>
        </View>

        {/* Alert Feed */}
        <ScrollView
          className="flex-1 px-4 pt-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00d4ff"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {alerts.length === 0 ? (
            <EmptyState />
          ) : (
            alerts.map((alert, index) => (
              <Animated.View
                key={alert.id}
                style={{
                  opacity: fadeAnims[index] || 1,
                }}
              >
                <AlertCard alert={alert} />
              </Animated.View>
            ))
          )}
          <View className="h-24" />
        </ScrollView>

        {/* Bottom Navigation */}
        <View className="absolute bottom-6 left-4 right-4 flex-row justify-center gap-4">
          <Pressable
            onPress={() => router.push("/scan")}
            className="flex-1 bg-info py-4 rounded-xl flex-row items-center justify-center"
          >
            <QrCode size={20} color="#1a1d23" />
            <Text
              className="text-background font-bold text-base ml-2"
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            >
              Scan QR
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/vehicles")}
            className="flex-1 bg-border py-4 rounded-xl flex-row items-center justify-center"
          >
            <Car size={20} color="#f4f1ea" />
            <Text
              className="text-foreground font-bold text-base ml-2"
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            >
              My Vehicles
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
