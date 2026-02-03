import { Ionicons } from "@expo/vector-icons";
import {
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps,
  View,
} from "react-native";

interface CustomTextInputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
}

export const TextInput = ({ icon, style, ...props }: CustomTextInputProps) => {
  return (
    <View style={styles.container}>
      {icon && (
        <Ionicons name={icon} size={20} color="#94a3b8" style={styles.icon} />
      )}
      <RNTextInput
        style={[styles.input, icon && styles.inputWithIcon, style]}
        placeholderTextColor="#64748b"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  icon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    width: "100%",
  },
  inputWithIcon: {
    paddingLeft: 40,
  },
});
