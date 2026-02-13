import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
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
} from "@/assets/icons";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import { db } from "@/db/database";
import { useAndroidBackHandler } from "@/hooks/use-android-back-handler";
import { Card, CardRarity, CardType } from "@/interfaces/card";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const MIN_PANEL_HEIGHT = SCREEN_HEIGHT * 0.35;
const MAX_PANEL_HEIGHT = SCREEN_HEIGHT * 0.45;

export default function CardDetailScreen() {
  const { theme } = useTheme();
  const { cardId, collectionId, cardIds } = useLocalSearchParams();
  const cardIdStr = typeof cardId === "string" ? cardId : "";
  const cardIdsStr = typeof cardIds === "string" ? cardIds : "";
  const collectionIdStr = typeof collectionId === "string" ? collectionId : "";

  // Determine fallback route based on context
  const fallbackRoute = collectionIdStr ? undefined : "/search";
  useAndroidBackHandler(fallbackRoute);

  const [cards, setCards] = useState<Card[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Load cards from database
  useEffect(() => {
    const loadCards = async () => {
      const orderedCardIds = cardIdsStr.split(",").filter((id) => id);
      if (orderedCardIds.length === 0) return;

      const placeholders = orderedCardIds.map(() => "?").join(",");
      const cardsData = await db.getAllAsync(
        `SELECT * FROM cards WHERE id IN (${placeholders})`,
        orderedCardIds,
      );

      // Sort cards in the same order as the IDs
      const sortedCards = orderedCardIds
        .map((id) => cardsData.find((c: any) => c.id === id))
        .filter((card): card is Card => card !== undefined);

      setCards(sortedCards);

      // Find initial index
      const initialIdx = sortedCards.findIndex((card) => card.id === cardIdStr);
      setActiveIndex(initialIdx >= 0 ? initialIdx : 0);
    };

    loadCards();
  }, [cardIdStr, cardIdsStr]);

  const handleBack = () => {
    if (collectionIdStr) {
      router.push({
        pathname: "/collection-detail",
        params: { id: collectionIdStr },
      });
    } else {
      router.back();
    }
  };

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleBack();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [collectionIdStr]);

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

  const { width: windowWidth } = useWindowDimensions();

  const processAbilityText = (text: string) => {
    if (!text) return "";

    let processed = text
      .replace(
        /:rb_(energy_\d+|exhaust|might):/g,
        '<span class="icon" data-icon="rb_$1"></span>',
      )
      .replace(
        /:rb_rune_(calm|chaos|fury|mind|order|body|rainbow):/g,
        '<span class="icon" data-icon="rb_rune_$1"></span>',
      )
      .replace(/\[([^\]]+)\]/g, "<strong>$1</strong>")
      .replace(/<ul>(<br\s*\/?>)+/g, "<ul>")
      .replace(/(<br\s*\/?>)+<\/ul>/g, "</ul>")
      .replace(/<\/li>(<br\s*\/?>)+<li>/g, "</li><li>");

    return processed;
  };

  const renderersProps = {
    img: {
      enableExperimentalPercentWidth: true,
    },
  };

  const renderers = {
    span: ({ tnode }: any) => {
      const dataIcon = tnode.attributes["data-icon"];
      if (!dataIcon || tnode.attributes.class !== "icon") return null;

      const iconSize = 12;
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

      if (IconComponent) {
        return (
          <IconComponent
            width={iconSize}
            height={iconSize}
            color={Colors[theme].text}
          />
        );
      }

      if (webpSource) {
        return (
          <Image
            source={webpSource}
            style={{ width: iconSize, height: iconSize }}
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

  if (cards.length === 0) {
    return null;
  }

  const activeCard = cards[activeIndex];
  if (!activeCard) return null;

  const cardPrice =
    activeCard.price && activeCard.price > 0
      ? activeCard.price
      : activeCard.price_foil && activeCard.price_foil > 0
        ? activeCard.price_foil
        : 0;

  const styles = createStyles(theme);
  console.log("Rendering CardDetailScreen for card:", cardIds);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.closeButton}>
            <FontAwesome name="arrow-left" size={20} color="#ffffff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeCard.name}
          </Text>
          <View style={styles.detailButton} />
        </View>

        {/* Carousel */}
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
            data={cards}
            defaultIndex={activeIndex}
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

        {/* Card Details Panel */}
        <Animated.View style={[styles.detailsPanel, { height: panelHeight }]}>
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

            {/* Stats Grid */}
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
                      color: theme === "dark" ? "#e2e8f0" : "#334155",
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                    tagsStyles={{
                      em: {
                        fontStyle: "italic",
                        color: theme === "dark" ? "#e2e8f0" : "#334155",
                      },
                      strong: {
                        fontWeight: "bold",
                        color: Colors[theme].text,
                      },
                      span: {
                        color: theme === "dark" ? "#e2e8f0" : "#334155",
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
    </>
  );
}

const createStyles = (theme: "light" | "dark") => {
  const colors = Colors[theme];
  const isDark = theme === "dark";

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
      backgroundColor: isDark
        ? "rgba(30, 41, 59, 0.95)"
        : "rgba(241, 245, 249, 0.95)",
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
      width: 40,
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
      backgroundColor: isDark
        ? "rgba(30, 41, 59, 1)"
        : "rgba(241, 245, 249, 1)",
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
      backgroundColor: isDark
        ? "rgba(30, 41, 59, 1)"
        : "rgba(255, 255, 255, 1)",
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
      backgroundColor: isDark
        ? "rgba(148, 163, 184, 0.4)"
        : "rgba(100, 116, 139, 0.4)",
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
      color: isDark ? "#94a3b8" : "#64748b",
    },
    priceSection: {
      alignItems: "flex-end",
    },
    priceLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: isDark ? "#64748b" : "#94a3b8",
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
      backgroundColor: isDark
        ? "rgba(100, 116, 139, 0.15)"
        : "rgba(226, 232, 240, 0.5)",
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(100, 116, 139, 0.2)"
        : "rgba(203, 213, 225, 0.5)",
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
    statLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: isDark ? "#64748b" : "#94a3b8",
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
    abilitySection: {
      marginBottom: 24,
    },
    abilityLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#64748b" : "#94a3b8",
      letterSpacing: 1,
      marginBottom: 12,
    },
    abilityContainer: {
      backgroundColor: isDark
        ? "rgba(100, 116, 139, 0.1)"
        : "rgba(226, 232, 240, 0.5)",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(100, 116, 139, 0.2)"
        : "rgba(203, 213, 225, 0.5)",
    },
  });
};
