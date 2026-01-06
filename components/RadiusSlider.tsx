import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { MIN_RADIUS_KM, MAX_RADIUS_KM } from "@/types/alerts";

interface RadiusSliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function RadiusSlider({ value, onValueChange }: RadiusSliderProps) {
  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-foreground text-lg font-semibold"
          style={{ fontFamily: "SpaceGrotesk_700Bold" }}
        >
          Alert Radius
        </Text>
        <Text
          className="text-info text-lg"
          style={{ fontFamily: "IBMPlexMono_400Regular" }}
        >
          {value >= 1 ? `${value.toFixed(1)}km` : `${Math.round(value * 1000)}m`}
        </Text>
      </View>

      <View className="bg-border/50 rounded-xl p-4">
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={MIN_RADIUS_KM}
          maximumValue={MAX_RADIUS_KM}
          step={0.1}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor="#00d4ff"
          maximumTrackTintColor="#2d3139"
          thumbTintColor="#00d4ff"
        />

        <View className="flex-row justify-between mt-2">
          <Text
            className="text-muted text-xs"
            style={{ fontFamily: "IBMPlexMono_400Regular" }}
          >
            500m
          </Text>
          <Text
            className="text-muted text-xs"
            style={{ fontFamily: "IBMPlexMono_400Regular" }}
          >
            5km
          </Text>
        </View>
      </View>

      <Text className="text-muted text-sm mt-4 text-center">
        You'll receive alerts from neighbors within this radius
      </Text>
    </View>
  );
}
