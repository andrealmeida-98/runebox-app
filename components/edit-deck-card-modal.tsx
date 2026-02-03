import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/contexts/theme-context";
import { getCardReprintsByName } from "@/db/queries/cards";
import { replaceCardInDeck, updateCardQuantityInDeck } from "@/db/queries/deck";
import { Card } from "@/interfaces/card";
import { ModalDialog } from "./modal";
import { TextInput } from "./text-input";

interface EditDeckCardModalProps {
  visible: boolean;
  card: Card & { quantity?: number };
  deckId: string;
  onClose: () => void;
  onSave: () => void;
  onNotification?: (
    message: string,
    severity: "success" | "error" | "info"
  ) => void;
}

export function EditDeckCardModal({
  visible,
  card,
  deckId,
  onClose,
  onSave,
  onNotification,
}: EditDeckCardModalProps) {
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState(card.quantity?.toString() || "1");
  const [reprints, setReprints] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState(card.id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const styles = createStyles(theme);

  // Load card reprints when modal opens
  const loadReprints = useCallback(async () => {
    try {
      setLoading(true);
      const cardReprints = await getCardReprintsByName(card.name);
      setReprints(cardReprints);
    } catch (error) {
      console.error("Error loading card reprints:", error);
    } finally {
      setLoading(false);
    }
  }, [card.name]);

  useEffect(() => {
    if (visible) {
      loadReprints();
      setQuantity(card.quantity?.toString() || "1");
      setSelectedCardId(card.id);
    }
  }, [visible, card, loadReprints]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const newQuantity = parseInt(quantity) || 1;

      // Check if card version changed
      if (selectedCardId !== card.id) {
        // Replace with different version
        await replaceCardInDeck(deckId, card.id, selectedCardId, newQuantity);
        onNotification?.("Card updated successfully", "success");
      } else {
        // Just update quantity
        await updateCardQuantityInDeck(deckId, card.id, newQuantity);
        onNotification?.("Quantity updated successfully", "success");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating card:", error);
      onNotification?.("Failed to update card", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalDialog
      visible={visible}
      onClose={onClose}
      title="Edit Card"
      maxHeight="85%"
    >
      <View style={styles.container}>
        {/* Current Card Info */}
        <View style={styles.currentCard}>
          <Image
            source={
              card.image_url
                ? { uri: card.image_url }
                : require("@/assets/images/riftbound-card-example.png")
            }
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardSet}>
              {card.set_name} ({card.set_abv})
            </Text>
            <Text style={styles.cardId}>{card.id}</Text>
          </View>
        </View>

        {/* Quantity Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quantity</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            placeholder="Enter quantity"
          />
        </View>

        {/* Card Versions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Card Versions ({reprints.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading versions...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.reprintsScroll}
              showsVerticalScrollIndicator={false}
            >
              {reprints.map((reprint) => (
                <Pressable
                  key={reprint.id}
                  style={[
                    styles.reprintItem,
                    selectedCardId === reprint.id && styles.reprintItemSelected,
                  ]}
                  onPress={() => setSelectedCardId(reprint.id)}
                >
                  <Image
                    source={
                      reprint.image_url
                        ? { uri: reprint.image_url }
                        : require("@/assets/images/riftbound-card-example.png")
                    }
                    style={styles.reprintImage}
                    resizeMode="cover"
                  />
                  <View style={styles.reprintInfo}>
                    <Text style={styles.reprintName}>{reprint.name}</Text>
                    <Text style={styles.reprintSet}>
                      {reprint.set_name} ({reprint.set_abv})
                    </Text>
                    <Text style={styles.reprintId}>{reprint.id}</Text>
                  </View>
                  {selectedCardId === reprint.id && (
                    <View style={styles.selectedBadge}>
                      <FontAwesome name="check" size={16} color="#ffffff" />
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.buttonSecondary]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.buttonPrimary,
              saving && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ModalDialog>
  );
}

const createStyles = (theme: "light" | "dark") => {
  const isDark = theme === "dark";

  return StyleSheet.create({
    container: {
      gap: 20,
    },
    currentCard: {
      flexDirection: "row",
      gap: 12,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.05)",
      padding: 12,
      borderRadius: 12,
    },
    cardImage: {
      width: 80,
      height: 112,
      borderRadius: 8,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    },
    cardInfo: {
      flex: 1,
      justifyContent: "center",
    },
    cardName: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#ffffff" : "#000000",
      marginBottom: 4,
    },
    cardSet: {
      fontSize: 13,
      color: isDark ? "#94a3b8" : "#64748b",
      marginBottom: 2,
    },
    cardId: {
      fontSize: 12,
      color: isDark ? "#64748b" : "#94a3b8",
    },
    section: {
      gap: 12,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#cbd5e1" : "#475569",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingVertical: 20,
    },
    loadingText: {
      fontSize: 14,
      color: isDark ? "#94a3b8" : "#64748b",
    },
    reprintsScroll: {
      maxHeight: 250,
    },
    reprintItem: {
      flexDirection: "row",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "transparent",
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.03)",
      marginBottom: 8,
    },
    reprintItemSelected: {
      borderColor: "#3b82f6",
      backgroundColor: isDark
        ? "rgba(59, 130, 246, 0.1)"
        : "rgba(59, 130, 246, 0.1)",
    },
    reprintImage: {
      width: 60,
      height: 84,
      borderRadius: 6,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    },
    reprintInfo: {
      flex: 1,
      justifyContent: "center",
    },
    reprintName: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#000000",
      marginBottom: 4,
    },
    reprintSet: {
      fontSize: 12,
      color: isDark ? "#94a3b8" : "#64748b",
      marginBottom: 2,
    },
    reprintId: {
      fontSize: 11,
      color: isDark ? "#64748b" : "#94a3b8",
    },
    selectedBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#3b82f6",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPrimary: {
      backgroundColor: "#3b82f6",
    },
    buttonSecondary: {
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
    },
    buttonTextSecondary: {
      color: isDark ? "#ffffff" : "#000000",
    },
  });
};
