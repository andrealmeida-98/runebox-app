import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "ghost"
  | "outline";

type ButtonSize = "tiny" | "small" | "medium" | "large";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof FontAwesome.glyphMap;
  iconSize?: number;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "medium",
  icon,
  iconSize,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  children,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
        };
      case "secondary":
        return {
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
        };
      case "success":
        return {
          backgroundColor: "#10b981",
          borderColor: "#059669",
        };
      case "danger":
        return {
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
        };
      case "warning":
        return {
          backgroundColor: "#f59e0b",
          borderColor: "#d97706",
        };
      case "info":
        return {
          backgroundColor: "#06b6d4",
          borderColor: "#0891b2",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: "#475569",
        };
      default:
        return {
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "tiny":
        return {
          paddingHorizontal: 8,
          paddingVertical: 6,
        };
      case "small":
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
        };
      case "medium":
        return {
          paddingHorizontal: 16,
          paddingVertical: 14,
        };
      case "large":
        return {
          paddingHorizontal: 20,
          paddingVertical: 16,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 14,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === "ghost" || variant === "outline") {
      return "#ffffff";
    }
    return "#ffffff";
  };

  const getFontSize = (): number => {
    switch (size) {
      case "small":
        return 13;
      case "medium":
        return 16;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const getIconSize = (): number => {
    if (iconSize) return iconSize;
    switch (size) {
      case "small":
        return 14;
      case "medium":
        return 16;
      case "large":
        return 20;
      default:
        return 16;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.loader}
        />
      );
    }

    const iconElement = icon && (
      <FontAwesome name={icon} size={getIconSize()} color={getTextColor()} />
    );

    const textElement =
      typeof children === "string" ? (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
              fontWeight: size === "small" ? "600" : "700",
            },
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      );

    if (!icon) {
      return textElement;
    }

    return (
      <>
        {iconPosition === "left" && iconElement}
        {textElement}
        {iconPosition === "right" && iconElement}
      </>
    );
  };

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>{renderContent()}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    letterSpacing: 0.5,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  loader: {
    marginHorizontal: 8,
  },
});
