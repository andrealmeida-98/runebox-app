import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CommonIcon,
  EpicIcon,
  RareIcon,
  ShowcaseIcon,
  UncommonIcon,
} from "@/assets/icons";
import { getHeaderWithMenu } from "@/constants/header-options";
import { GLOBAL_CARDS, USER_COLLECTION_ENTRIES } from "@/dummy-data";
import { Card, CardRarity } from "@/interfaces/card";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const MIN_PANEL_HEIGHT = SCREEN_HEIGHT * 0.4; // 40% minimum
const MAX_PANEL_HEIGHT = SCREEN_HEIGHT * 0.7; // 70% maximum

export default function CardDetailScreen() {
  const { cardId, collectionId, cardIds } = useLocalSearchParams();
  const cardIdStr = typeof cardId === "string" ? cardId : "";
  const collectionIdStr = typeof collectionId === "string" ? collectionId : "1";
  const cardIdsStr = typeof cardIds === "string" ? cardIds : "";

  // Get cards in the order they were passed (filtered and sorted)
  const orderedCardIds = cardIdsStr.split(",").filter((id) => id);
  const collectionCards: Card[] = orderedCardIds
    .map((id) => GLOBAL_CARDS.find((card) => card.id === id))
    .filter((card): card is Card => card !== undefined);

  // Find initial index of the clicked card
  const initialIndex = collectionCards.findIndex(
    (card) => card.id === cardIdStr
  );

  const collectionEntries = USER_COLLECTION_ENTRIES.filter(
    (entry) => entry.collection_id === collectionIdStr
  );
  const [activeIndex, setActiveIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

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

  // Calculate carousel height based on panel height
  const carouselHeight = panelHeight.interpolate({
    inputRange: [MIN_PANEL_HEIGHT, MAX_PANEL_HEIGHT],
    outputRange: [CARD_HEIGHT + 60, CARD_HEIGHT * 0.6 + 40],
    extrapolate: "clamp",
  });

  const activeCard = collectionCards[activeIndex];
  const activeEntry = collectionEntries.find(
    (entry) => entry.card_id === activeCard?.id
  );

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

  if (!activeCard) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={getHeaderWithMenu(activeCard.name)} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {/* Carousel */}
        <Animated.View
          style={[styles.carouselWrapper, { height: carouselHeight }]}
        >
          <Carousel
            loop={false}
            width={CARD_WIDTH}
            style={{
              width: SCREEN_WIDTH,
              justifyContent: "center",
              alignItems: "center",
            }}
            height={CARD_HEIGHT + 60}
            data={collectionCards}
            defaultIndex={initialIndex >= 0 ? initialIndex : 0}
            onSnapToItem={(index) => setActiveIndex(index)}
            renderItem={({ item, index }) => (
              <View style={styles.carouselItem}>
                <Animated.View
                  style={[
                    styles.cardWrapper,
                    index === activeIndex && styles.cardWrapperActive,
                    {
                      transform: [
                        {
                          scale: panelHeight.interpolate({
                            inputRange: [MIN_PANEL_HEIGHT, MAX_PANEL_HEIGHT],
                            outputRange: [1, 0.75],
                            extrapolate: "clamp",
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={require("@/assets/images/riftbound-card-example.png")}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>
            )}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.85,
              parallaxScrollingOffset: 35,
            }}
          />
        </Animated.View>

        {/* Card Details Panel */}
        <Animated.View style={[styles.detailsPanel, { height: panelHeight }]}>
          {/* Drag Handle */}
          <View
            style={styles.dragHandleContainer}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragHandle} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Card Name and Price */}
            <View style={styles.headerRow}>
              <View style={styles.nameSection}>
                <Text style={styles.cardName}>{activeCard.name}</Text>
                <Text style={styles.cardSubtitle}>
                  {activeCard.set_name} #{activeCard.set_abv}
                </Text>
              </View>
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>MARKET PRICE</Text>
                <View style={styles.priceWithChange}>
                  <Text style={styles.priceValue}>
                    ${activeCard.price?.toFixed(2) || "0.00"}
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

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statItem, { width: "20%" }]}>
                <Text style={styles.statValue}>
                  {activeEntry?.quantity || 0}
                </Text>
                <Text style={styles.statLabel}>QTY</Text>
              </View>
              <View style={[styles.statItem, { width: "60%" }]}>
                <View style={styles.rarityContainer}>
                  {(() => {
                    const RarityIcon = getRarityIcon(activeCard.rarity);
                    return RarityIcon ? (
                      <View
                        style={{
                          marginBottom: 3,
                        }}
                      >
                        <RarityIcon
                          width={20}
                          height={20}
                          color={getRarityColor(activeCard.rarity)}
                        />
                      </View>
                    ) : null;
                  })()}
                  <Text
                    style={[
                      styles.statValue,
                      { color: getRarityColor(activeCard.rarity) },
                    ]}
                  >
                    {activeCard.rarity.toLocaleUpperCase()}
                  </Text>
                </View>
                <Text style={styles.statLabel}>RARITY</Text>
              </View>
              <View style={[styles.statItem, { width: "20%" }]}>
                <Text style={[styles.statValue]}>{activeCard.card_type}</Text>
                <Text style={styles.statLabel}>TYPE</Text>
              </View>
            </View>

            {/* Domain and Might Section */}
            <View style={styles.attributesRow}>
              {activeCard.domain && (
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>DOMAIN</Text>
                  <View style={styles.attributeValueContainer}>
                    <Text style={styles.attributeValue}>
                      {activeCard.domain}
                    </Text>
                  </View>
                </View>
              )}
              {activeCard.card_type === "Unit" &&
                activeCard.might !== undefined && (
                  <View style={styles.attributeItem}>
                    <Text style={styles.attributeLabel}>MIGHT</Text>
                    <View style={styles.attributeValueContainer}>
                      <Text style={styles.attributeValue}>
                        {activeCard.might}
                      </Text>
                    </View>
                  </View>
                )}
              {activeCard.energy !== undefined && (
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>ENERGY</Text>
                  <View style={styles.attributeValueContainer}>
                    <Text style={styles.attributeValue}>
                      {activeCard.energy}
                    </Text>
                  </View>
                </View>
              )}
              {activeCard.power !== undefined && (
                <View style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>POWER</Text>
                  <View style={styles.attributeValueContainer}>
                    <Text style={styles.attributeValue}>
                      {activeCard.power}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Card Ability Section */}
            {activeCard.ability ? (
              <View style={styles.abilitySection}>
                <Text style={styles.abilityLabel}>ABILITY</Text>
                <View style={styles.abilityContainer}>
                  <Text style={styles.abilityText}>
                    {activeCard.ability
                      .split(/(\[[^\]]+\])/)
                      .map((part, index) => {
                        if (part.match(/\[[^\]]+\]/)) {
                          return (
                            <Text key={index} style={styles.abilityTextBold}>
                              {part}
                            </Text>
                          );
                        }
                        return <Text key={index}>{part}</Text>;
                      })}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  carouselWrapper: {
    width: SCREEN_WIDTH,
    marginTop: 0,
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
  foilBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  foilText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
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
  statsRow: {
    flexDirection: "row",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 24,
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
  rarityIcon: {
    width: 20,
    height: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  typeValue: {
    color: "#f97316",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  attributesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  attributeItem: {
    flex: 1,
    minWidth: "45%",
  },
  attributeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 8,
  },
  attributeValueContainer: {
    backgroundColor: "rgba(100, 116, 139, 0.15)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
  attributeValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  pricesSection: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  priceRowLabel: {
    fontSize: 14,
    color: "#cbd5e1",
  },
  priceRowValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  psaPrice: {
    color: "#22c55e",
  },
  historyButton: {
    backgroundColor: "#334155",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
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
  abilityText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#e2e8f0",
  },
  abilityTextBold: {
    fontWeight: "700",
  },
});
