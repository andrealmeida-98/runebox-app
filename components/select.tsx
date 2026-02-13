import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

interface SelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
}: SelectProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      {/* Select Button */}
      <Pressable
        style={[
          styles.selectButton,
          {
            backgroundColor: colors.cardItemBackground,
            borderColor: colors.cardItemBorder,
          },
        ]}
        onPress={() => setIsOpen(true)}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: value ? colors.text : colors.tertiaryText,
            },
          ]}
        >
          {value || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.tertiaryText}
        />
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.cardItemBackground,
                borderColor: colors.cardItemBorder,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option, index) => (
                <Pressable
                  key={`${option}-${index}`}
                  style={[
                    styles.option,
                    value === option && {
                      backgroundColor: colors.info,
                    },
                    index < options.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.cardItemBorder,
                    },
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          value === option
                            ? "#ffffff"
                            : colors.text,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                  {value === option && (
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdown: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
});
