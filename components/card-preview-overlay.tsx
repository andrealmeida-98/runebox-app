import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CommonIcon,
  EpicIcon,
  RareIcon,
  RbEnergy10Icon,
  RbEnergy11Icon,
  RbEnergy12Icon,
  RbEnergy1Icon,
  RbEnergy2Icon,
  RbEnergy3Icon,
  RbEnergy4Icon,
  RbEnergy5Icon,
  RbEnergy6Icon,
  RbEnergy7Icon,
  RbEnergy8Icon,
  RbEnergy9Icon,
  RbExhaustIcon,
  RbMightIcon,
  RbRuneRainbowIcon,
  ShowcaseIcon,
  UncommonIcon,
} from "@/assets/icons";
import { Card, CardRarity, CardType } from "@/interfaces/card";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const MIN_PANEL_HEIGHT = SCREEN_HEIGHT * 0.4; // 40% minimum
const MAX_PANEL_HEIGHT = SCREEN_HEIGHT * 0.7; // 70% maximum

interface CardPreviewOverlayProps {
  visible: boolean;
  cards: Card[];
  initialIndex: number;
  onClose: () => void;
  onCardPress?: (card: Card) => void;
  singleCardMode?: boolean; // If true, only shows the single card without carousel
}

export function CardPreviewOverlay({
  visible,
  cards,
  initialIndex,
  onClose,
  onCardPress,
  singleCardMode = false,
}: CardPreviewOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

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
        return true; // Prevent default back behavior
      }
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Use single card mode for large lists or when explicitly requested
  const effectiveSingleCardMode = singleCardMode || cards.length > 100;
  const displayCards = effectiveSingleCardMode ? [cards[initialIndex]] : cards;
  const displayIndex = effectiveSingleCardMode ? 0 : activeIndex;

  // Panel drag animation
  const panelHeight = useRef(new Animated.Value(MIN_PANEL_HEIGHT)).current;
  const lastPanelHeight = useRef(MIN_PANEL_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = lastPanelHeight.current - gestureState.dy;
        if (newHeight >= MIN_PANEL_HEIGHT && newHeight <= MAX_PANEL_HEIGHT) {
          panelHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = lastPanelHeight.current - gestureState.dy;
        const finalHeight =
          newHeight < (MIN_PANEL_HEIGHT + MAX_PANEL_HEIGHT) / 2
            ? MIN_PANEL_HEIGHT
            : MAX_PANEL_HEIGHT;

        lastPanelHeight.current = finalHeight;
        Animated.spring(panelHeight, {
          toValue: finalHeight,
          damping: 20,
          stiffness: 300,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const activeCard = displayCards[displayIndex];

  // Get window dimensions for RenderHTML
  const { width: windowWidth } = useWindowDimensions();

  // Process ability text to replace custom icon tags with img tags
  const processAbilityText = (text: string) => {
    if (!text) return "";

    // Replace custom icon tags with span tags that we'll handle in the renderer
    let processed = text
      .replace(
        /:rb_(energy_\d+|exhaust|might):/g,
        '<span class="icon" data-icon="rb_$1"></span>'
      )
      .replace(
        /:rb_rune_(calm|chaos|fury|mind|order|body|rainbow):/g,
        '<span class="icon" data-icon="rb_rune_$1"></span>'
      )
      // Replace [text] with <strong>text</strong>
      .replace(/\[([^\]]+)\]/g, "<strong>$1</strong>")
      // Remove <br /> tags inside <ul> elements
      .replace(/<ul>(<br\s*\/?>)+/g, "<ul>")
      .replace(/(<br\s*\/?>)+<\/ul>/g, "</ul>")
      .replace(/<\/li>(<br\s*\/?>)+<li>/g, "</li><li>");

    return processed;
  };

  // Custom renderer for images (icons)
  const renderersProps = {
    img: {
      enableExperimentalPercentWidth: true,
    },
  };
  const renderers = {
    span: ({ tnode }: any) => {
      const dataIcon = tnode.attributes["data-icon"];

      if (!dataIcon || tnode.attributes.class !== "icon") {
        return null;
      }

      const iconSize = 12;

      // Map icon names to SVG components
      const iconMap: { [key: string]: any } = {
        rb_energy_1: RbEnergy1Icon,
        rb_energy_2: RbEnergy2Icon,
        rb_energy_3: RbEnergy3Icon,
        rb_energy_4: RbEnergy4Icon,
        rb_energy_5: RbEnergy5Icon,
        rb_energy_6: RbEnergy6Icon,
        rb_energy_7: RbEnergy7Icon,
        rb_energy_8: RbEnergy8Icon,
        rb_energy_9: RbEnergy9Icon,
        rb_energy_10: RbEnergy10Icon,
        rb_energy_11: RbEnergy11Icon,
        rb_energy_12: RbEnergy12Icon,
        rb_exhaust: RbExhaustIcon,
        rb_might: RbMightIcon,
        rb_rune_rainbow: RbRuneRainbowIcon,
      };

      // Map webp icon names to require paths
      const webpIconMap: { [key: string]: any } = {
        rb_rune_calm: require("@/assets/icons/calm.webp"),
        rb_rune_chaos: require("@/assets/icons/chaos.webp"),
        rb_rune_fury: require("@/assets/icons/fury.webp"),
        rb_rune_mind: require("@/assets/icons/mind.webp"),
        rb_rune_order: require("@/assets/icons/order.webp"),
        rb_rune_body: require("@/assets/icons/body.webp"),
      };

      const IconComponent = iconMap[dataIcon];
      const webpSource = webpIconMap[dataIcon];

      // Render SVG icon
      if (IconComponent) {
        return (
          <IconComponent width={iconSize} height={iconSize} color="#ffffff" />
        );
      }

      // Render webp image
      if (webpSource) {
        return (
          <Image
            source={webpSource}
            style={{
              width: iconSize,
              height: iconSize,
            }}
          />
        );
      }

      return null;
    },
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case CardRarity.COMMON:
        return "#9EB1C0";
      case CardRarity.UNCOMMON:
        return "#39B5C0";
      case CardRarity.RARE:
        return "#cf006bff";
      case CardRarity.EPIC:
        return "#fc6e32ff";
      case CardRarity.SHOWCASE:
        return "#ffd900ff";
      default:
        return "#ffffff";
    }
  };

  const getRarityIcon = (rarity: string) => {
    const rarityLower = rarity.toLowerCase();
    switch (rarityLower) {
      case CardRarity.COMMON:
        return CommonIcon;
      case CardRarity.UNCOMMON:
        return UncommonIcon;
      case CardRarity.RARE:
        return RareIcon;
      case CardRarity.EPIC:
        return EpicIcon;
      case CardRarity.SHOWCASE:
        return ShowcaseIcon;
      default:
        return null;
    }
  };

  const handleCardPress = () => {
    // if (onCardPress && activeCard) {
    //   onCardPress(activeCard);
    // } else if (activeCard) {
    //   // Default behavior: navigate to card detail
    //   router.push(`/card-detail?cardId=${activeCard.id}`);
    // }
    console.log("Card pressed:", activeCard);
  };

  if (!activeCard) {
    return null;
  }

  const cardPrice =
    activeCard.price && activeCard.price > 0
      ? activeCard.price
      : activeCard.price_foil && activeCard.price_foil > 0
      ? activeCard.price_foil
      : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeCard.name}
          </Text>
          <Pressable onPress={handleCardPress} style={styles.detailButton}>
            <FontAwesome name="external-link" size={20} color="#ffffff" />
          </Pressable>
        </View>

        {/* Carousel or Single Card */}
        {effectiveSingleCardMode ? (
          // Single Card View
          <View style={[styles.carouselWrapper, { height: CARD_HEIGHT + 60 }]}>
            <View style={styles.carouselItem}>
              <View style={[styles.cardWrapper, styles.cardWrapperActive]}>
                <Image
                  source={
                    activeCard.image_url
                      ? { uri: activeCard.image_url }
                      : require("@/assets/images/back-image.png")
                  }
                  style={[
                    styles.cardImage,
                    activeCard.card_type === CardType.BATTLEFIELD &&
                      styles.rotatedImage,
                  ]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        ) : (
          // Carousel View
          <View style={[styles.carouselWrapper, { height: CARD_HEIGHT + 60 }]}>
            <Carousel
              loop={false}
              width={CARD_WIDTH}
              style={{
                width: SCREEN_WIDTH,
                justifyContent: "center",
                alignItems: "center",
              }}
              height={CARD_HEIGHT + 60}
              data={displayCards}
              defaultIndex={initialIndex >= 0 ? initialIndex : 0}
              onSnapToItem={(index) => setActiveIndex(index)}
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
                        item.image_url
                          ? { uri: item.image_url }
                          : require("@/assets/images/riftbound-card-example.png")
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
        )}

        {/* Card Details Panel */}
        <Animated.View
          style={[
            styles.detailsPanel,
            {
              height: panelHeight,
            },
          ]}
        >
          {/* Drag Handle */}
          <View
            style={styles.dragHandleContainer}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragHandle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Card Name and Price */}
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.nameSection}>
                  <Text style={styles.cardName}>{activeCard.name}</Text>
                  <Text style={styles.cardSubtitle}>{activeCard.id}</Text>
                </View>
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>MARKET PRICE</Text>

                  <View style={styles.priceWithChange}>
                    <Text style={styles.priceValue}>
                      €{cardPrice.toFixed(2)}
                    </Text>
                    {activeCard.price_change !== undefined && (
                      <View
                        style={[
                          styles.priceChangeContainer,
                          {
                            backgroundColor:
                              activeCard.price_change >= 0
                                ? "rgba(34, 197, 94, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                          },
                        ]}
                      >
                        <FontAwesome
                          name={
                            activeCard.price_change >= 0
                              ? "arrow-up"
                              : "arrow-down"
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

            {/* V2 */}
            {/* <View style={styles.headerRow}>
              <View style={styles.nameSection}>
                <Text style={styles.cardSubtitle}>MARKET PRICE</Text>
                <Text style={{ ...styles.cardName, fontSize: 36 }}>
                  €{cardPrice.toFixed(2)}
                </Text>
              </View>

              <View
                style={{
                  ...styles.priceSection,
                  gap: 8,
                }}
              >
                <Text style={styles.cardSubtitle}>Last 24 hours</Text>

                <View style={styles.priceWithChange}>
                  {activeCard.price_change !== undefined && (
                    <View
                      style={{
                        ...styles.priceChangeContainer,
                        backgroundColor:
                          activeCard.price_change >= 0
                            ? "rgba(34, 197, 94, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        marginTop: "auto",
                      }}
                    >
                      <FontAwesome
                        name={
                          activeCard.price_change >= 0
                            ? "arrow-up"
                            : "arrow-down"
                        }
                        size={12}
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
                            fontSize: 16,
                          },
                        ]}
                      >
                        {Math.abs(activeCard.price_change).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View> */}
            {/* Stats Grid - 2x2 */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: "rgba(251, 191, 36, 0.15)" },
                  ]}
                >
                  <RbMightIcon width={24} height={24} color="#fbbf24" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>MIGHT</Text>
                  <Text style={styles.statValue}>
                    {activeCard.might !== undefined && activeCard.might !== null
                      ? activeCard.might
                      : "--"}
                  </Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: "rgba(239, 68, 68, 0.15)" },
                  ]}
                >
                  <FontAwesome name="fire" size={24} color="#ef4444" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>ENERGY</Text>
                  <Text style={styles.statValue}>
                    {activeCard.energy !== undefined &&
                    activeCard.energy !== null
                      ? activeCard.energy
                      : "--"}
                  </Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: "rgba(59, 130, 246, 0.15)" },
                  ]}
                >
                  <FontAwesome name="cube" size={24} color="#3b82f6" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>TYPE</Text>
                  <Text style={styles.statValueSmall}>
                    {activeCard.card_type || "--"}
                  </Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer]}>
                  <FontAwesome name="star" size={24} color="#f4eb00ff" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statLabel}>RARITY</Text>
                  <Text style={styles.statValueSmall}>
                    {activeCard.rarity.charAt(0).toUpperCase() +
                      activeCard.rarity.slice(1) || "--"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card Ability Section */}
            {activeCard.ability && (
              <View style={styles.abilitySection}>
                <Text style={styles.abilityLabel}>ABILITY</Text>
                <View style={styles.abilityContainer}>
                  <RenderHTML
                    contentWidth={windowWidth - 96}
                    source={{ html: processAbilityText(activeCard.ability) }}
                    renderers={renderers}
                    renderersProps={renderersProps}
                    baseStyle={{
                      color: "#e2e8f0",
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                    tagsStyles={{
                      em: {
                        fontStyle: "italic",
                        color: "#e2e8f0",
                      },
                      strong: {
                        fontWeight: "bold",
                        color: "#ffffff",
                      },
                      span: {
                        color: "#e2e8f0",
                      },
                      p: {
                        margin: 0,
                        padding: 0,
                      },
                    }}
                  />
                </View>
              </View>
            )}
            {/* Action Button */}
            <Pressable style={styles.actionButton} onPress={handleCardPress}>
              <Text style={styles.actionButtonText}>View Full Details</Text>
              <FontAwesome name="arrow-right" size={16} color="#ffffff" />
            </Pressable>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#1e293b",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginHorizontal: 16,
  },
  detailButton: {
    padding: 8,
  },
  carouselWrapper: {
    width: SCREEN_WIDTH,
    marginTop: 0,
    justifyContent: "flex-start",
  },
  carouselItem: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    position: "relative",
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
  detailsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  dragHandleContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(148, 163, 184, 0.4)",
    borderRadius: 2,
  },
  scrollContent: {
    paddingTop: 12,
  },
  headerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.15)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameSection: {
    flex: 1,
  },
  cardName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  priceSection: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceWithChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#22c55e",
  },
  priceChangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceChangeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    height: 80,
    backgroundColor: "rgba(100, 116, 139, 0.15)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  rarityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  infoSection: {
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.15)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  attributeItem: {
    flex: 1,
    minWidth: "30%",
  },
  attributeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 6,
  },
  attributeValueContainer: {
    paddingVertical: 4,
  },
  attributeValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  abilitySection: {
    marginBottom: 24,
  },
  abilityLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 12,
  },
  abilityContainer: {
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
