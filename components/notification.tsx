import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useCallback, useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export type NotificationSeverity = "success" | "error" | "warning" | "info";

interface NotificationProps {
  message: string;
  severity: NotificationSeverity;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Notification({
  message,
  severity,
  visible,
  onDismiss,
  duration = 4000,
}: NotificationProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  const handleDismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  }, [slideAnim, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, duration, slideAnim, handleDismiss]);

  if (!visible) return null;

  const getColors = () => {
    switch (severity) {
      case "success":
        return {
          bg: "#22c55e",
          icon: "check-circle" as const,
        };
      case "error":
        return {
          bg: "#ef4444",
          icon: "exclamation-circle" as const,
        };
      case "warning":
        return {
          bg: "#f59e0b",
          icon: "exclamation-triangle" as const,
        };
      case "info":
        return {
          bg: "#3b82f6",
          icon: "info-circle" as const,
        };
      default:
        return {
          bg: "#64748b",
          icon: "info-circle" as const,
        };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <FontAwesome name={colors.icon} size={20} color="#ffffff" />
        <Text style={styles.message}>{message}</Text>
      </View>
      <Pressable onPress={handleDismiss} style={styles.closeButton}>
        <FontAwesome name="times" size={18} color="#ffffff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999999999,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
