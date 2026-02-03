import FontAwesome from "@expo/vector-icons/FontAwesome";
import { BlurView as ExpoBlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { Card, CardType } from "@/interfaces/card";
import { EditCardModal } from "./edit-card-modal";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const PANEL_HEIGHT = 120;

interface CardCollectionPreviewModalProps {
  visible: boolean;
  cards: (Card & { quantity?: number })[];
  initialIndex: number;
  collectionId?: string;
  isDeck?: boolean;
  onClose: () => void;
  onEdit?: (card: Card & { quantity?: number }) => void;
  onViewDetails?: (card: Card & { quantity?: number }) => void;
  onAddToCollection?: (card: Card & { quantity?: number }) => void;
  onRemove?: (card: Card & { quantity?: number }) => void;
  onNotification?: (
    message: string,
    severity: "success" | "error" | "info",
  ) => void;
  onIndexChange?: (index: number) => void;
}

export function CardCollectionPreviewModal({
  visible,
  cards,
  initialIndex,
  collectionId,
  isDeck = false,
  onClose,
  onEdit,
  onViewDetails,
  onAddToCollection,
  onRemove,
  onNotification,
  onIndexChange,
}: CardCollectionPreviewModalProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const activeCard = cards[activeIndex] || cards[0];

  // Sync activeIndex with initialIndex when it changes
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  if (!activeCard) return null;

  const cardPrice =
    activeCard.price && activeCard.price > 0
      ? activeCard.price
      : activeCard.price_foil && activeCard.price_foil > 0
        ? activeCard.price_foil
        : 0;

  const styles = createStyles(theme);

  const handleEditSave = async (updatedCard?: Card & { quantity?: number }) => {
    // Call onEdit callback if provided to refresh the parent component
    if (onEdit) {
      setIsUpdating(true);
      await onEdit(updatedCard || activeCard);
      // Wait a bit for the UI to update
      setTimeout(() => setIsUpdating(false), 300);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Blurred Background */}
        <ExpoBlurView intensity={100} tint="dark" style={styles.blurView}>
          <Pressable style={styles.backdrop} onPress={onClose} />
        </ExpoBlurView>
        <View style={styles.darkOverlay} />

        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <FontAwesome name="times" size={24} color="#fff" />
        </Pressable>

        {/* Card Carousel */}
        <View style={[styles.carouselWrapper, { height: CARD_HEIGHT + 60 }]}>
          <Carousel
            key={`carousel-${initialIndex}`}
            loop={false}
            width={CARD_WIDTH}
            style={{
              width: SCREEN_WIDTH,
              justifyContent: "center",
              alignItems: "center",
            }}
            height={CARD_HEIGHT + 60}
            data={cards}
            defaultIndex={initialIndex}
            onProgressChange={(_, absoluteProgress) => {
              const index = Math.round(absoluteProgress);
              if (index !== activeIndex && index >= 0 && index < cards.length) {
                setActiveIndex(index);
                onIndexChange?.(index);
              }
            }}
            renderItem={({ item, index }) => (
              <View style={styles.carouselItem}>
                <View
                  style={[
                    styles.cardWrapper,
                    index === activeIndex && styles.cardWrapperActive,
                  ]}
                >
                  <Image
                    source={
                      isUpdating && index === activeIndex
                        ? require("@/assets/images/back-image.png")
                        : item.image_url
                          ? { uri: item.image_url }
                          : require("@/assets/images/back-image.png")
                    }
                    style={[
                      styles.cardImage,
                      item.card_type === CardType.BATTLEFIELD &&
                        styles.rotatedImage,
                    ]}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.85,
              parallaxScrollingOffset: 35,
            }}
          />
        </View>

        {/* Action Buttons - Button Group below card */}
        <View style={styles.buttonGroup}>
          {onEdit && collectionId && (
            <Pressable
              style={[styles.groupButton, styles.groupButtonLeft]}
              onPress={() => {
                setShowEditModal(true);
              }}
            >
              <FontAwesome name="edit" size={18} color="#fff" />
              <Text style={styles.groupButtonText}>Edit</Text>
            </Pressable>
          )}
          {onAddToCollection && (
            <Pressable
              style={styles.groupButton}
              onPress={() => {
                onAddToCollection(activeCard);
                onClose();
              }}
            >
              <FontAwesome name="plus" size={18} color="#fff" />
              <Text style={styles.groupButtonText}>Add to Deck</Text>
            </Pressable>
          )}
          {onViewDetails && (
            <Pressable
              style={styles.groupButton}
              onPress={() => {
                onViewDetails(activeCard);
                onClose();
              }}
            >
              <FontAwesome name="info-circle" size={18} color="#fff" />
              <Text style={styles.groupButtonText}>Details</Text>
            </Pressable>
          )}
          {onRemove && (
            <Pressable
              style={[styles.groupButton, styles.groupButtonDanger]}
              onPress={() => {
                onRemove(activeCard);
                onClose();
              }}
            >
              <FontAwesome name="trash" size={18} color="#fff" />
              <Text style={styles.groupButtonText}>Remove</Text>
            </Pressable>
          )}
          <Pressable
            style={[
              styles.groupButton,
              styles.groupButtonRight,
              styles.groupButtonContrary,
            ]}
            onPress={onClose}
          >
            <FontAwesome
              name="times"
              size={18}
              color="rgba(59, 130, 246, 0.9)"
            />
            <Text
              style={[
                styles.groupButtonText,
                { color: "rgba(59, 130, 246, 0.9)" },
              ]}
            >
              Close
            </Text>
          </Pressable>
        </View>

        {/* Card Details Panel */}
        <View style={styles.detailsPanel}>
          <View style={styles.drawerContent}>
            {/* Card Name and Basic Info */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Text style={styles.cardName}>
                  {activeCard.quantity ? `${activeCard.quantity}x ` : ""}
                  {activeCard.name}
                </Text>
                <Text style={styles.cardId}>
                  {activeCard.id} • {activeCard.set_abv}
                </Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={styles.priceValue}>{cardPrice.toFixed(2)} €</Text>
                {activeCard.price_change !== undefined && (
                  <View style={styles.priceChangeRow}>
                    <FontAwesome
                      name={
                        activeCard.price_change >= 0 ? "arrow-up" : "arrow-down"
                      }
                      size={10}
                      color={
                        activeCard.price_change >= 0 ? "#22c55e" : "#ef4444"
                      }
                    />
                    <Text
                      style={[
                        styles.priceChangeText,
                        {
                          color:
                            activeCard.price_change >= 0
                              ? "#22c55e"
                              : "#ef4444",
                        },
                      ]}
                    >
                      {Math.abs(activeCard.price_change).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Edit Card Modal */}
      {collectionId && (
        <EditCardModal
          visible={showEditModal}
          card={activeCard}
          collectionId={collectionId}
          isDeck={isDeck}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          onNotification={onNotification}
        />
      )}
    </Modal>
  );
}

const createStyles = (theme: "light" | "dark") => {
  const isDark = theme === "dark";
  const colors = Colors[theme];

  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      position: "relative",
    },
    blurView: {
      ...StyleSheet.absoluteFillObject,
    },
    backdrop: {
      flex: 1,
    },
    darkOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      pointerEvents: "none",
    },
    closeButton: {
      position: "absolute",
      top: 60,
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    carouselWrapper: {
      marginTop: 250,
      alignItems: "center",
      justifyContent: "center",
    },
    carouselItem: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    cardWrapper: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: isDark
        ? "rgba(30, 41, 59, 0.9)"
        : "rgba(241, 245, 249, 0.9)",
    },
    cardWrapperActive: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    rotatedImage: {
      transform: [{ rotate: "90deg" }, { scale: 1.4 }],
    },
    actionButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
      marginTop: 20,
      marginBottom: 20,
      paddingHorizontal: 24,
    },
    actionButton: {
      backgroundColor: "rgba(59, 130, 246, 0.9)",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 100,
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    actionButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    detailsPanel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: PANEL_HEIGHT,
      backgroundColor: isDark
        ? "rgba(30, 41, 59, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 16,
    },
    buttonGroup: {
      flexDirection: "row",
      marginTop: 10,
      marginHorizontal: 32,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    groupButton: {
      flex: 1,
      backgroundColor: "rgba(59, 130, 246, 0.9)",
      paddingVertical: 10,
      paddingHorizontal: 6,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      borderRightWidth: 1,
      borderRightColor: "rgba(255, 255, 255, 0.2)",
    },
    groupButtonLeft: {
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    groupButtonRight: {
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
      borderRightWidth: 0,
    },
    groupButtonContrary: {
      backgroundColor: "white",
    },
    groupButtonDanger: {
      backgroundColor: "rgba(239, 68, 68, 0.9)",
    },
    groupButtonText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
    groupButtonTextNeutral: {
      color: "#fff",
    },
    drawerContent: {
      paddingVertical: 20,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    infoLeft: {
      flex: 1,
    },
    cardName: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 6,
    },
    cardId: {
      fontSize: 13,
      color: isDark ? "#94a3b8" : "#64748b",
      fontWeight: "500",
    },
    infoRight: {
      alignItems: "flex-end",
    },
    priceValue: {
      fontSize: 22,
      fontWeight: "800",
      color: "#22c55e",
      marginBottom: 4,
    },
    priceChangeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    priceChangeText: {
      fontSize: 12,
      fontWeight: "700",
    },
  });
};
