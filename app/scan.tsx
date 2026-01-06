import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Alert as RNAlert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { X, Camera } from "lucide-react-native";

import { AlertType, ALERT_TYPES } from "@/types/alerts";
import { createAlert } from "@/lib/api";
import { AlertTypeSelectorModal } from "@/components/AlertTypeSelectorModal";
import { BroadcastSuccessModal } from "@/components/BroadcastSuccessModal";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [alertSelectorVisible, setAlertSelectorVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [lastBroadcastType, setLastBroadcastType] = useState<AlertType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const extractQrToken = (data: string): string | null => {
    // QR URL format: https://vizinhoalert.eu/vehicle/{qr_token}
    const match = data.match(/\/vehicle\/([a-zA-Z0-9_-]+)$/);
    if (match) {
      return match[1];
    }
    // Also accept raw token
    if (data.length >= 20 && !data.includes("/")) {
      return data;
    }
    return null;
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    const token = extractQrToken(data);
    if (token) {
      setScanned(true);
      setScannedToken(token);
      setAlertSelectorVisible(true);
    } else {
      RNAlert.alert("Invalid QR Code", "This doesn't appear to be a VizinhoAlert vehicle QR code.");
    }
  };

  const handleAlertTypeSelect = async (type: AlertType) => {
    if (!scannedToken || isSubmitting) return;

    setIsSubmitting(true);
    setAlertSelectorVisible(false);

    try {
      const loc = await Location.getCurrentPositionAsync({});

      await createAlert(
        scannedToken,
        type,
        loc.coords.latitude,
        loc.coords.longitude
      );

      setLastBroadcastType(type);
      setSuccessModalVisible(true);
    } catch (error: any) {
      console.error("Failed to create alert:", error);
      RNAlert.alert(
        "Alert Failed",
        error.message || "Failed to send alert. Please try again."
      );
      // Reset scan state on error
      setScanned(false);
      setScannedToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    router.back();
  };

  const handleModalClose = () => {
    setAlertSelectorVisible(false);
    setScanned(false);
    setScannedToken(null);
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-warning/20 items-center justify-center mb-6">
          <Camera size={36} color="#ff9500" strokeWidth={1.5} />
        </View>

        <Text
          className="text-foreground text-2xl font-bold mb-4 text-center"
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        >
          Camera Access Required
        </Text>

        <Text className="text-muted text-center text-base mb-8">
          We need camera access to scan vehicle QR codes.
        </Text>

        <Pressable
          onPress={requestPermission}
          className="bg-info w-full py-4 rounded-lg items-center mb-4"
        >
          <Text
            className="text-background font-bold text-base"
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          >
            Grant Permission
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="py-3"
        >
          <Text className="text-muted text-base">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4">
            <View>
              <Text
                className="text-white text-xl font-bold"
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              >
                Scan Vehicle QR
              </Text>
              <Text
                className="text-white/70 text-xs"
                style={{ fontFamily: "IBMPlexMono_400Regular" }}
              >
                Point camera at car sticker
              </Text>
            </View>

            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <X size={20} color="#ffffff" />
            </Pressable>
          </View>

          {/* Scanner Frame */}
          <View className="flex-1 items-center justify-center">
            <View
              className="w-64 h-64 border-2 border-info rounded-2xl"
              style={{ borderStyle: "dashed" }}
            />
            <Text className="text-white/80 text-sm mt-4 text-center">
              Align QR code within the frame
            </Text>
          </View>

          {/* Instructions */}
          <View className="px-6 pb-8">
            <View className="bg-black/60 rounded-xl p-4">
              <Text className="text-white/90 text-sm text-center">
                Scan the QR code on a vehicle to send an alert to its owner.
                No personal information is shared.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>

      <AlertTypeSelectorModal
        visible={alertSelectorVisible}
        onClose={handleModalClose}
        onSelectType={handleAlertTypeSelect}
      />

      <BroadcastSuccessModal
        visible={successModalVisible}
        onClose={handleSuccessClose}
        alertType={lastBroadcastType}
      />
    </View>
  );
}
