import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { getCardReprintsByName } from "@/db/queries/cards";
import {
  replaceCardInCollection,
  updateCardQuantityInCollection,
} from "@/db/queries/collection";
import { replaceCardInDeck, updateCardQuantityInDeck } from "@/db/queries/deck";
import { Card, CardType } from "@/interfaces/card";
import { ModalDialog } from "./modal";
import { TextInput } from "./text-input";

interface EditCardModalProps {
  visible: boolean;
  card: Card & { quantity?: number };
  collectionId: string;
  isDeck?: boolean;
  onClose: () => void;
  onSave: (updatedCard?: Card & { quantity?: number }) => void;
  onNotification?: (
    message: string,
    severity: "success" | "error" | "info"
  ) => void;
}

export function EditCardModal({
  visible,
  card,
  collectionId,
  isDeck = false,
  onClose,
  onSave,
  onNotification,
}: EditCardModalProps) {
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState(card.quantity?.toString() || "1");
  const [reprints, setReprints] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState(card.id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const styles = createStyles(theme);

  // Load card reprints when modal opens
  useEffect(() => {
    if (visible) {
      loadReprints();
      setQuantity(card.quantity?.toString() || "1");
      setSelectedCardId(card.id);
    }
  }, [visible, card]);

  const loadReprints = async () => {
    try {
      setLoading(true);
      const cardReprints = await getCardReprintsByName(card.name);
      setReprints(cardReprints);
    } catch (error) {
      console.error("Error loading card reprints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const newQuantity = parseInt(quantity) || 1;

      // Check if card version changed
      if (selectedCardId !== card.id) {
        // Find the new card from reprints
        const newCard = reprints.find((r) => r.id === selectedCardId);

        // Replace with different version
        if (isDeck) {
          await replaceCardInDeck(
            collectionId,
            card.id,
            selectedCardId,
            newQuantity
          );
        } else {
          await replaceCardInCollection(
            collectionId,
            card.id,
            selectedCardId,
            newQuantity
          );
        }
        onNotification?.("Card updated successfully", "success");

        // Pass the updated card back
        if (newCard) {
          onSave({ ...newCard, quantity: newQuantity });
        } else {
          onSave();
        }
      } else {
        // Just update quantity
        if (isDeck) {
          await updateCardQuantityInDeck(collectionId, card.id, newQuantity);
        } else {
          await updateCardQuantityInCollection(
            collectionId,
            card.id,
            newQuantity
          );
        }
        onNotification?.("Quantity updated successfully", "success");

        // Pass the updated quantity back
        onSave({ ...card, quantity: newQuantity });
      }

      onClose();
    } catch (error) {
      console.error("Error saving card changes:", error);
      onNotification?.("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const incrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    setQuantity((current + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    if (current > 1) {
      setQuantity((current - 1).toString());
    }
  };

  return (
    <ModalDialog visible={visible} onClose={onClose} title="Edit Card">
      <View style={styles.container}>
        {/* Quantity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityControl}>
            <Pressable
              style={styles.quantityButton}
              onPress={decrementQuantity}
            >
              <FontAwesome name="minus" size={16} color="#fff" />
            </Pressable>
            <View style={styles.quantityInputWrapper}>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>
            <Pressable
              style={styles.quantityButton}
              onPress={incrementQuantity}
            >
              <FontAwesome name="plus" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Card Version Selection */}
        <View style={styles.versionSection}>
          <Text style={styles.sectionTitle}>
            Card Version ({reprints.length} available)
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading versions...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.reprintsScrollView}
              contentContainerStyle={styles.reprintsContainer}
              showsVerticalScrollIndicator={true}
            >
              {reprints.map((reprint) => (
                <Pressable
                  key={reprint.id}
                  style={[
                    styles.reprintCard,
                    selectedCardId === reprint.id && styles.reprintCardSelected,
                  ]}
                  onPress={() => setSelectedCardId(reprint.id)}
                >
                  <View style={styles.reprintImageContainer}>
                    <Image
                      source={
                        reprint.image_url
                          ? { uri: reprint.image_url }
                          : require("@/assets/images/back-image.png")
                      }
                      style={[
                        styles.reprintImage,
                        reprint.card_type === CardType.BATTLEFIELD &&
                          styles.rotatedImage,
                      ]}
                      resizeMode="cover"
                    />
                    {selectedCardId === reprint.id && (
                      <View style={styles.selectedBadge}>
                        <FontAwesome name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.reprintInfo}>
                    <Text style={styles.reprintSetName}>
                      {reprint.set_name}
                    </Text>
                    <Text style={styles.reprintSetAbv}>
                      {reprint.set_abv} • {reprint.id}
                    </Text>
                    <Text style={styles.reprintPrice}>
                      €{(reprint.price || reprint.price_foil || 0).toFixed(2)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.saveButton,
              saving && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
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
  const colors = Colors[theme];

  return StyleSheet.create({
    container: {
      gap: 16,
    },
    section: {
      gap: 12,
    },
    versionSection: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    quantityControl: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    quantityButton: {
      backgroundColor: "#3b82f6",
      width: 44,
      height: 44,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    quantityInputWrapper: {
      flex: 1,
      minWidth: 0,
    },
    quantityInput: {
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
    },
    loadingContainer: {
      padding: 40,
      alignItems: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: isDark ? "#94a3b8" : "#64748b",
    },
    reprintsScrollView: {
      maxHeight: 300,
    },
    reprintsContainer: {
      gap: 12,
      paddingBottom: 8,
    },
    reprintCard: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
      borderRadius: 12,
      padding: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    reprintCardSelected: {
      borderColor: "#3b82f6",
      backgroundColor: isDark
        ? "rgba(59, 130, 246, 0.1)"
        : "rgba(59, 130, 246, 0.05)",
    },
    reprintImageContainer: {
      position: "relative",
      width: 60,
      height: 84,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: isDark ? "#0f172a" : "#e2e8f0",
    },
    reprintImage: {
      width: "100%",
      height: "100%",
    },
    rotatedImage: {
      transform: [{ rotate: "90deg" }, { scale: 1.4 }],
    },
    selectedBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "#22c55e",
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    reprintInfo: {
      flex: 1,
      marginLeft: 12,
      justifyContent: "center",
      gap: 4,
    },
    reprintSetName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    reprintSetAbv: {
      fontSize: 12,
      color: isDark ? "#94a3b8" : "#64748b",
    },
    reprintPrice: {
      fontSize: 14,
      fontWeight: "700",
      color: "#22c55e",
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: isDark ? "#334155" : "#cbd5e1",
    },
    saveButton: {
      backgroundColor: "#3b82f6",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
  });
};
