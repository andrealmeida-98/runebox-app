import type { ThemeMode } from "@/utils/theme-utils";
import { getThemeColors } from "@/utils/theme-utils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable } from "react-native";

export const getStandardHeaderOptions = (
  title?: string,
  headerRight?: () => React.JSX.Element,
  theme: ThemeMode = "dark",
) => {
  const { cardBackground } = getThemeColors(theme);

  return {
    title: title || "",
    headerStyle: {
      backgroundColor: cardBackground,
    },
    headerTintColor: "#ffffff",
    headerTitleStyle: {
      fontWeight: "bold" as const,
    },
    ...(headerRight && { headerRight }),
  };
};

export const getHeaderWithMenu = (
  title: string,
  onMenuPress?: () => void,
  theme: ThemeMode = "dark",
) =>
  getStandardHeaderOptions(
    title,
    () => (
      <Pressable style={{ padding: 8, marginRight: 8 }} onPress={onMenuPress}>
        <FontAwesome name="ellipsis-v" size={24} color="#ffffff" />
      </Pressable>
    ),
    theme,
  );
