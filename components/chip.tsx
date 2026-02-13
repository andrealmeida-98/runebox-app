import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

type ChipVariant = "primary" | "secondary" | "info" | "success" | "warning" | "error";
type ChipSize = "small" | "medium";

interface ChipProps {
  label: string;
  onRemove?: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  style?: ViewStyle;
}

export function Chip({
  label,
  onRemove,
  variant = "info",
  size = "medium",
  style,
}: ChipProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getVariantColors = () => {
    switch (variant) {
      case "primary":
        return {
          background: colors.successBackground,
          text: colors.success,
        };
      case "secondary":
        return {
          background: "rgba(148, 163, 184, 0.2)",
          text: colors.secondaryText,
        };
      case "info":
        return {
          background: colors.infoBackground,
          text: colors.info,
        };
      case "success":
        return {
          background: colors.successBackground,
          text: colors.success,
        };
      case "warning":
        return {
          background: colors.warningBackground,
          text: colors.warning,
        };
      case "error":
        return {
          background: colors.errorBackground,
          text: colors.error,
        };
      default:
        return {
          background: colors.infoBackground,
          text: colors.info,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
        };
      case "medium":
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
        };
      default:
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
        };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: variantColors.background,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: variantColors.text,
            fontSize: sizeStyles.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          style={styles.removeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="close-circle"
            size={size === "small" ? 14 : 16}
            color={colors.tertiaryText}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    gap: 6,
  },
  label: {
    fontWeight: "600",
  },
  removeButton: {
    justifyContent: "center",
    alignItems: "center",
  },
});
