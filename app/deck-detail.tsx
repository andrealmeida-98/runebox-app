import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CommonIcon from "@/assets/icons/common.svg";
import EpicIcon from "@/assets/icons/epic.svg";
import RareIcon from "@/assets/icons/rare.svg";
import ShowcaseIcon from "@/assets/icons/showcase.svg";
import UncommonIcon from "@/assets/icons/uncommon.svg";
import { GLOBAL_CARDS, USER_DECK_ENTRIES, USER_DECKS } from "@/dummy-data";
import { Card, CardRarity, CardType } from "@/interfaces/card";

export default function DeckDetailScreen() {
  const { deckId } = useLocalSearchParams();
  const deckIdStr = typeof deckId === "string" ? deckId : "";

  const deck = USER_DECKS.find((d) => d.id === deckIdStr);
  const deckEntries = USER_DECK_ENTRIES.filter(
    (entry) => entry.deck_id === deckIdStr
  );

  if (!deck) {
    return null;
  }

  // Get all cards in the deck with their quantities
  const deckCards = deckEntries
    .map((entry) => {
      const card = GLOBAL_CARDS.find((c) => c.id === entry.card_id);
      return card ? { card, quantity: entry.quantity } : null;
    })
    .filter((item): item is { card: Card; quantity: number } => item !== null);

  // Categorize cards
  const legends = deckCards.filter(
    (item) => item.card.card_type === CardType.LEGEND
  );
  const units = deckCards.filter(
    (item) => item.card.card_type === CardType.UNIT
  );
  const spells = deckCards.filter(
    (item) => item.card.card_type === CardType.SPELL
  );
  const gear = deckCards.filter(
    (item) => item.card.card_type === CardType.GEAR
  );
  const battlefields = deckCards.filter(
    (item) => item.card.card_type === CardType.BATTLEFIELD
  );
  const runes = deckCards.filter(
    (item) => item.card.card_type === CardType.RUNE
  );

  // Calculate stats
  const totalCards = deckCards.reduce((sum, item) => sum + item.quantity, 0);
  const avgEnergy =
    deckCards.reduce(
      (sum, item) => sum + (item.card.energy || 0) * item.quantity,
      0
    ) / totalCards;

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

  const renderCardItem = (item: { card: Card; quantity: number }) => {
    const RarityIcon = getRarityIcon(item.card.rarity);
    return (
      <Pressable
        key={item.card.id}
        style={styles.cardItem}
        onPress={() =>
          router.push({
            pathname: "/card-detail",
            params: { cardId: item.card.id },
          })
        }
      >
        <View style={styles.cardLeft}>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.card.name}</Text>
            <View style={styles.cardMeta}>
              {RarityIcon && (
                <RarityIcon
                  width={14}
                  height={14}
                  color={getRarityColor(item.card.rarity)}
                />
              )}
              {item.card.energy !== undefined && (
                <View style={styles.energyBadge}>
                  <FontAwesome name="bolt" size={10} color="#fbbf24" />
                  <Text style={styles.energyText}>{item.card.energy}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          {item.card.price && (
            <Text style={styles.cardPrice}>${item.card.price.toFixed(2)}</Text>
          )}
          <FontAwesome name="chevron-right" size={14} color="#64748b" />
        </View>
      </Pressable>
    );
  };

  const renderSection = (
    title: string,
    cards: { card: Card; quantity: number }[],
    count: number
  ) => {
    if (cards.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        </View>
        <View style={styles.sectionContent}>
          {cards.map((item) => renderCardItem(item))}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: deck.name,
          headerStyle: {
            backgroundColor: "#1e293b",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
              <FontAwesome name="arrow-left" size={20} color="#ffffff" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable style={{ padding: 8, marginRight: 8 }}>
              <FontAwesome name="ellipsis-v" size={24} color="#ffffff" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Deck Stats Header */}
          <View style={styles.statsHeader}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCards}/56</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>AVG. {avgEnergy.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Energy</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.energyIconRow}>
                <FontAwesome name="circle" size={12} color="#3b82f6" />
                <Text style={styles.statValue}>20</Text>
              </View>
              <View style={styles.energyIconRow}>
                <FontAwesome name="certificate" size={12} color="#fbbf24" />
                <Text style={styles.statValue}>34</Text>
              </View>
            </View>
          </View>

          {/* Card Categories */}
          {renderSection(
            "LEGEND",
            legends,
            legends.reduce((sum, item) => sum + item.quantity, 0)
          )}
          {renderSection(
            "UNITS",
            units,
            units.reduce((sum, item) => sum + item.quantity, 0)
          )}
          {renderSection(
            "SPELLS",
            spells,
            spells.reduce((sum, item) => sum + item.quantity, 0)
          )}
          {renderSection(
            "GEAR",
            gear,
            gear.reduce((sum, item) => sum + item.quantity, 0)
          )}
          {renderSection(
            "BATTLEFIELDS",
            battlefields,
            battlefields.reduce((sum, item) => sum + item.quantity, 0)
          )}
          {renderSection(
            "RUNES",
            runes,
            runes.reduce((sum, item) => sum + item.quantity, 0)
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  statsHeader: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  energyIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: "rgba(100, 116, 139, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  sectionContent: {
    gap: 8,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.15)",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  quantityBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderWidth: 2,
    borderColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3b82f6",
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  energyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  energyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fbbf24",
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22c55e",
  },
});
