import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  Modal,
  Image,
  Alert as RNAlert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Plus, X, Car, QrCode, Trash2 } from "lucide-react-native";

import { Vehicle, VehicleQR } from "@/types/alerts";
import {
  fetchMyVehicles,
  registerVehicle,
  fetchVehicleQR,
  deleteVehicle,
} from "@/lib/api";

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add vehicle modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [vehicleIdInput, setVehicleIdInput] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR modal
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedVehicleQR, setSelectedVehicleQR] = useState<VehicleQR | null>(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState<string>("");
  const [loadingQR, setLoadingQR] = useState(false);

  const loadVehicles = async () => {
    try {
      const data = await fetchMyVehicles();
      setVehicles(data);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const handleAddVehicle = async () => {
    if (!vehicleIdInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newVehicle = await registerVehicle(
        vehicleIdInput.trim(),
        nicknameInput.trim() || undefined
      );
      setVehicles((prev) => [...prev, newVehicle]);
      setAddModalVisible(false);
      setVehicleIdInput("");
      setNicknameInput("");
    } catch (error: any) {
      RNAlert.alert(
        "Registration Failed",
        error.message || "Failed to register vehicle."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowQR = async (vehicle: Vehicle) => {
    setLoadingQR(true);
    setSelectedVehicleName(vehicle.nickname || "Vehicle");
    setQrModalVisible(true);

    try {
      const qrData = await fetchVehicleQR(vehicle.id);
      setSelectedVehicleQR(qrData);
    } catch (error) {
      console.error("Failed to load QR:", error);
      RNAlert.alert("Error", "Failed to load QR code.");
      setQrModalVisible(false);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    RNAlert.alert(
      "Delete Vehicle",
      `Are you sure you want to remove "${vehicle.nickname || "this vehicle"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
            } catch (error) {
              RNAlert.alert("Error", "Failed to delete vehicle.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4ff"
          />
        }
      >
        {loading ? (
          <View className="items-center justify-center py-20">
            <Text className="text-muted">Loading vehicles...</Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View className="items-center justify-center px-8 py-20">
            <View className="w-20 h-20 rounded-full bg-border/50 items-center justify-center mb-6">
              <Car size={36} color="#6b7280" strokeWidth={1.5} />
            </View>

            <Text
              className="text-foreground text-xl font-bold mb-3 text-center"
              style={{ fontFamily: "SpaceGrotesk_700Bold" }}
            >
              No Vehicles Yet
            </Text>

            <Text className="text-muted text-center text-base mb-4">
              Register your vehicle to receive alerts from neighbors when
              something needs your attention.
            </Text>
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <View
              key={vehicle.id}
              className="bg-background border border-border rounded-lg p-4 mb-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-lg bg-info/15 items-center justify-center mr-4">
                    <Car size={24} color="#00d4ff" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-foreground text-lg font-semibold"
                      style={{ fontFamily: "SpaceGrotesk_700Bold" }}
                    >
                      {vehicle.nickname || "Vehicle"}
                    </Text>
                    <Text
                      className="text-muted text-xs"
                      style={{ fontFamily: "IBMPlexMono_400Regular" }}
                    >
                      Added {new Date(vehicle.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleShowQR(vehicle)}
                    className="w-10 h-10 rounded-lg bg-info/15 items-center justify-center"
                  >
                    <QrCode size={20} color="#00d4ff" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteVehicle(vehicle)}
                    className="w-10 h-10 rounded-lg bg-urgent/15 items-center justify-center"
                  >
                    <Trash2 size={20} color="#ff3b30" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Add Vehicle FAB */}
      <View className="absolute bottom-6 right-4">
        <Pressable
          onPress={() => setAddModalVisible(true)}
          className="w-14 h-14 rounded-full bg-info items-center justify-center"
          style={{
            shadowColor: "#00d4ff",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Plus size={28} color="#1a1d23" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Add Vehicle Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-10 px-4">
            <View className="flex-row items-center justify-between mb-6 px-2">
              <Text
                className="text-foreground text-2xl font-bold"
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              >
                Add Vehicle
              </Text>
              <Pressable
                onPress={() => setAddModalVisible(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-border"
              >
                <X size={20} color="#f4f1ea" />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-foreground text-sm font-medium mb-2">
                Vehicle ID (License Plate)
              </Text>
              <TextInput
                value={vehicleIdInput}
                onChangeText={setVehicleIdInput}
                placeholder="e.g., AB-12-CD"
                placeholderTextColor="#6b7280"
                className="bg-border/50 rounded-lg px-4 py-3 text-foreground"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text className="text-muted text-xs mt-2">
                This will be hashed for privacy. The original is never stored.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-foreground text-sm font-medium mb-2">
                Nickname (Optional)
              </Text>
              <TextInput
                value={nicknameInput}
                onChangeText={setNicknameInput}
                placeholder="e.g., Family Car"
                placeholderTextColor="#6b7280"
                className="bg-border/50 rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            <Pressable
              onPress={handleAddVehicle}
              disabled={!vehicleIdInput.trim() || isSubmitting}
              className={`py-4 rounded-lg items-center ${
                vehicleIdInput.trim() && !isSubmitting ? "bg-info" : "bg-border"
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  vehicleIdInput.trim() && !isSubmitting
                    ? "text-background"
                    : "text-muted"
                }`}
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              >
                {isSubmitting ? "Registering..." : "Register Vehicle"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm items-center border border-border">
            <View className="flex-row items-center justify-between w-full mb-4">
              <Text
                className="text-foreground text-xl font-bold"
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              >
                {selectedVehicleName}
              </Text>
              <Pressable
                onPress={() => {
                  setQrModalVisible(false);
                  setSelectedVehicleQR(null);
                }}
                className="w-8 h-8 items-center justify-center rounded-full bg-border"
              >
                <X size={16} color="#f4f1ea" />
              </Pressable>
            </View>

            {loadingQR ? (
              <View className="w-64 h-64 items-center justify-center">
                <Text className="text-muted">Loading QR code...</Text>
              </View>
            ) : selectedVehicleQR ? (
              <View className="items-center">
                <Image
                  source={{ uri: selectedVehicleQR.qr_code_data }}
                  style={{ width: 240, height: 240 }}
                  resizeMode="contain"
                />
                <Text className="text-muted text-sm text-center mt-4">
                  Print this QR code and place it on your vehicle's dashboard
                  or window.
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                setQrModalVisible(false);
                setSelectedVehicleQR(null);
              }}
              className="bg-info w-full py-3 rounded-lg items-center mt-4"
            >
              <Text
                className="text-background font-bold"
                style={{ fontFamily: "SpaceGrotesk_700Bold" }}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
