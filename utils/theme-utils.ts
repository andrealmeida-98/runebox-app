export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  backgroundColor: string;
  cardBackground: string;
  inputBackground: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
}

export function getThemeColors(theme: ThemeMode): ThemeColors {
  const isDark = theme === "dark";

  return {
    backgroundColor: isDark ? "#000000" : "#FFFFFF",
    cardBackground: isDark ? "#1a1a1a" : "#f5f5f5",
    inputBackground: isDark ? "#0f172a" : "#e5e7eb",
    textColor: isDark ? "#ffffff" : "#000000",
    secondaryTextColor: isDark ? "#94a3b8" : "#64748b",
    borderColor: isDark ? "#334155" : "#d1d5db",
  };
}
