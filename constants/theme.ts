/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#22c55e";
const tintColorDark = "#22c55e";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    // Card colors
    cardBackground: "rgba(255, 255, 255, 1)",
    headerBackground: "rgba(241, 245, 249, 0.95)",
    panelBackground: "rgba(255, 255, 255, 1)",
    statCardBackground: "rgba(226, 232, 240, 0.5)",
    statCardBorder: "rgba(203, 213, 225, 0.5)",
    dragHandle: "rgba(100, 116, 139, 0.4)",
    secondaryText: "#64748b",
    tertiaryText: "#94a3b8",
    abilityText: "#334155",
    // Semantic colors
    success: "#22c55e",
    successBackground: "rgba(34, 197, 94, 0.15)",
    error: "#ef4444",
    errorBackground: "rgba(239, 68, 68, 0.15)",
    warning: "#fbbf24",
    warningBackground: "rgba(251, 191, 36, 0.15)",
    info: "#3b82f6",
    infoBackground: "rgba(59, 130, 246, 0.15)",
    // Deck screen specific colors
    tabBarBackground: "#e2e8f0",
    tabBackground: "rgba(148, 163, 184, 0.3)",
    searchBackground: "#f1f5f9",
    cardItemBackground: "#f8fafc",
    cardItemBorder: "rgba(100, 116, 139, 0.25)",
    sectionHeaderText: "#64748b",
    sectionStatsBackground: "rgba(100, 116, 139, 0.2)",
    fabMenuBackground: "#f8fafc",
  },
  dark: {
    text: "#ECEDEE",
    background: "#000000",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    // Card colors
    cardBackground: "#1a1a1a",
    headerBackground: "#1a1a1a",
    panelBackground: "#1a1a1a",
    statCardBackground: "rgba(255, 255, 255, 0.05)",
    statCardBorder: "rgba(255, 255, 255, 0.1)",
    dragHandle: "rgba(255, 255, 255, 0.2)",
    secondaryText: "#94a3b8",
    tertiaryText: "#64748b",
    abilityText: "#e2e8f0",
    // Semantic colors
    success: "#22c55e",
    successBackground: "rgba(34, 197, 94, 0.15)",
    error: "#ef4444",
    errorBackground: "rgba(239, 68, 68, 0.15)",
    warning: "#fbbf24",
    warningBackground: "rgba(251, 191, 36, 0.15)",
    info: "#3b82f6",
    infoBackground: "rgba(59, 130, 246, 0.15)",
    // Deck screen specific colors
    tabBarBackground: "#0f172a",
    tabBackground: "rgba(100, 116, 139, 0.2)",
    searchBackground: "#0f172a",
    cardItemBackground: "#1e293b",
    cardItemBorder: "rgba(100, 116, 139, 0.15)",
    sectionHeaderText: "#94b894",
    sectionStatsBackground: "rgba(100, 116, 139, 0.3)",
    fabMenuBackground: "#1e293b",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
