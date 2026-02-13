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

import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

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
const WINDOW_SIZE = 5; // Cards before and after the current card
const LOAD_MORE_THRESHOLD = 3; // Trigger load more when this many cards from the end

interface CardPreviewOverlayProps {
  visible: boolean;
  cards: Card[];
  initialIndex: number;
  onClose: () => void;
  onCardPress?: (card: Card) => void;
  singleCardMode?: boolean; // If true, only shows the single card without carousel
  onLoadMore?: () => void; // Callback to load more cards
  hasMore?: boolean; // Whether there are more cards to load
  loadingMore?: boolean; // Whether cards are currently being loaded
}

export function CardPreviewOverlay({
  visible,
  cards,
  initialIndex,
  onClose,
  onCardPress,
  singleCardMode = false,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: CardPreviewOverlayProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const hasTriggeredLoadMore = useRef(false);

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
      },
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Calculate sliding window for carousel
  const calculateWindow = (currentIndex: number, totalCards: number) => {
    // If list is small or single card mode, don't apply sliding window
    if (totalCards <= WINDOW_SIZE * 2 + 1 || singleCardMode) {
      return {
        windowStart: 0,
        windowEnd: totalCards,
        localIndex: currentIndex,
      };
    }

    // Calculate window boundaries
    let windowStart = Math.max(0, currentIndex - WINDOW_SIZE);
    let windowEnd = Math.min(totalCards, currentIndex + WINDOW_SIZE + 1);

    // Adjust window size if at the edges
    const windowLength = windowEnd - windowStart;
    const targetLength = WINDOW_SIZE * 2 + 1;

    if (windowLength < targetLength) {
      if (windowStart === 0) {
        // At the beginning, extend to the right
        windowEnd = Math.min(totalCards, windowStart + targetLength);
      } else if (windowEnd === totalCards) {
        // At the end, extend to the left
        windowStart = Math.max(0, windowEnd - targetLength);
      }
    }

    // Calculate local index within the window
    const localIndex = currentIndex - windowStart;

    return { windowStart, windowEnd, localIndex };
  };

  // Detect when to load more cards
  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) {
      return;
    }

    // Check if we're approaching the end of the cards list
    if (activeIndex >= cards.length - LOAD_MORE_THRESHOLD) {
      if (!hasTriggeredLoadMore.current) {
        hasTriggeredLoadMore.current = true;
        onLoadMore();
      }
    } else {
      // Reset the flag when moving away from the end
      hasTriggeredLoadMore.current = false;
    }
  }, [activeIndex, cards.length, onLoadMore, hasMore, loadingMore]);

  // Use single card mode for large lists or when explicitly requested
  const effectiveSingleCardMode = singleCardMode || cards.length > 100;
  
  // Calculate window
  const { windowStart, windowEnd, localIndex } = calculateWindow(
    effectiveSingleCardMode ? initialIndex : activeIndex,
    cards.length
  );
  
  // Get cards for the current window
  const displayCards = effectiveSingleCardMode 
    ? [cards[initialIndex]] 
    : cards.slice(windowStart, windowEnd);
  
  const displayIndex = effectiveSingleCardMode ? 0 : localIndex;

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
    }),
  ).current;

  const activeCard = cards[activeIndex] || cards[initialIndex] || cards[0];

  // Get window dimensions for RenderHTML
  const { width: windowWidth } = useWindowDimensions();

  // Process ability text to replace custom icon tags with img tags
  const processAbilityText = (text: string) => {
    if (!text) return "";

    // Replace custom icon tags with span tags that we'll handle in the renderer
    let processed = text
      .replace(
        /:rb_(energy_\d+|exhaust|might):/g,
        '<span class="icon" data-icon="rb_$1"></span>',
      )
      .replace(
        /:rb_rune_(calm|chaos|fury|mind|order|body|rainbow):/g,
        '<span class="icon" data-icon="rb_rune_$1"></span>',
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
          <IconComponent
            width={iconSize}
            height={iconSize}
            color={Colors[theme].text}
          />
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
        return Colors[theme].text;
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

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color={Colors[theme].text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeCard.name}
          </Text>
          <Pressable onPress={handleCardPress} style={styles.detailButton}>
            <FontAwesome
              name="external-link"
              size={20}
              color={Colors[theme].text}
            />
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
              defaultIndex={localIndex >= 0 ? localIndex : 0}
              onProgressChange={(_, absoluteProgress) => {
                const localIdx = Math.round(absoluteProgress);
                // Map local index to global index
                const globalIdx = windowStart + localIdx;
                if (
                  globalIdx !== activeIndex &&
                  globalIdx >= 0 &&
                  globalIdx < cards.length
                ) {
                  setActiveIndex(globalIdx);
                }
              }}
              renderItem={({ item, index }) => {
                // Map local index to global index for highlighting
                const globalIdx = windowStart + index;
                return (
                  <View style={styles.carouselItem}>
                    <View
                      style={[
                        styles.cardWrapper,
                        globalIdx === activeIndex && styles.cardWrapperActive,
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
                );
              }}
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
                                ? Colors[theme].successBackground
                                : Colors[theme].errorBackground,
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
                            activeCard.price_change >= 0
                              ? Colors[theme].success
                              : Colors[theme].error
                          }
                        />
                        <Text
                          style={[
                            styles.priceChangeText,
                            {
                              color:
                                activeCard.price_change >= 0
                                  ? Colors[theme].success
                                  : Colors[theme].error,
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
            w
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: Colors[theme].warningBackground },
                  ]}
                >
                  <RbMightIcon
                    width={24}
                    height={24}
                    color={Colors[theme].warning}
                  />
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
                    { backgroundColor: Colors[theme].errorBackground },
                  ]}
                >
                  <FontAwesome
                    name="fire"
                    size={24}
                    color={Colors[theme].error}
                  />
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
                    { backgroundColor: Colors[theme].infoBackground },
                  ]}
                >
                  <FontAwesome
                    name="cube"
                    size={24}
                    color={Colors[theme].info}
                  />
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
                      color: Colors[theme].abilityText,
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                    tagsStyles={{
                      em: {
                        fontStyle: "italic",
                        color: Colors[theme].abilityText,
                      },
                      strong: {
                        fontWeight: "bold",
                        color: Colors[theme].text,
                      },
                      span: {
                        color: Colors[theme].abilityText,
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
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: "light" | "dark") => {
  const colors = Colors[theme];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.headerBackground,
    },
    closeButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
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
      backgroundColor: colors.cardBackground,
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
      backgroundColor: colors.panelBackground,
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
      backgroundColor: colors.dragHandle,
      borderRadius: 2,
    },
    scrollContent: {
      paddingTop: 12,
    },
    headerCard: {
      borderRadius: 12,
      marginBottom: 12,
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
      color: colors.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    priceSection: {
      alignItems: "flex-end",
    },
    priceLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.tertiaryText,
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
      color: colors.success,
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
      backgroundColor: colors.statCardBackground,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: colors.statCardBorder,
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
      color: colors.tertiaryText,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
    },
    statValueSmall: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    infoSection: {
      backgroundColor: colors.statCardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.statCardBorder,
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
      color: colors.tertiaryText,
      letterSpacing: 1,
      marginBottom: 6,
    },
    attributeValueContainer: {
      paddingVertical: 4,
    },
    attributeValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    abilitySection: {
      marginBottom: 24,
    },
    abilityLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.tertiaryText,
      letterSpacing: 1,
      marginBottom: 12,
    },
    abilityContainer: {
      backgroundColor: colors.statCardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.statCardBorder,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
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
};
