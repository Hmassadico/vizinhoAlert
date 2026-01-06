import React from "react";
import { Pressable, Animated } from "react-native";
import { Plus } from "lucide-react-native";

interface FloatingActionButtonProps {
  onPress: () => void;
}

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 24,
        right: 16,
        transform: [{ scale: scaleValue }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="w-16 h-16 rounded-full bg-info items-center justify-center shadow-lg"
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
    </Animated.View>
  );
}
