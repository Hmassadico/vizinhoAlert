import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono";
import "react-native-reanimated";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
    IBMPlexMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1d23" }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={({ route }) => ({
          headerShown: !route.name.startsWith("tempobook"),
          contentStyle: { backgroundColor: "#1a1d23" },
        })}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="scan"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="vehicles"
          options={{
            headerShown: true,
            title: "My Vehicles",
            headerStyle: { backgroundColor: "#1a1d23" },
            headerTintColor: "#f4f1ea",
            headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Settings",
            headerStyle: { backgroundColor: "#1a1d23" },
            headerTintColor: "#f4f1ea",
            headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
          }}
        />
      </Stack>
    </View>
  );
}
