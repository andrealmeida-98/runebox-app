import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Pressable } from "react-native";

export const getStandardHeaderOptions = (
  title?: string,
  headerRight?: () => React.JSX.Element
) => ({
  title: title || "",
  headerStyle: {
    backgroundColor: "#1e293b",
  },
  headerTintColor: "#ffffff",
  headerTitleStyle: {
    fontWeight: "bold" as const,
  },
  ...(headerRight && { headerRight }),
});

export const getHeaderWithMenu = (title: string, onMenuPress?: () => void) =>
  getStandardHeaderOptions(title, () => (
    <Pressable style={{ padding: 8, marginRight: 8 }} onPress={onMenuPress}>
      <FontAwesome name="ellipsis-v" size={24} color="#ffffff" />
    </Pressable>
  ));
