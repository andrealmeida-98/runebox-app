import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomDrawer } from "@/components/bottom-drawer";
import { CardGridItem } from "@/components/card-grid-item";
import { GLOBAL_CARDS, USER_COLLECTION_ENTRIES } from "@/dummy-data";
import { Card, CardRarity, CardType } from "@/interfaces/card";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_PADDING = 12;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function CollectionDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const collectionId = typeof id === "string" ? id : "1";
  const collectionName = typeof name === "string" ? name : "Collection";
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedCardTypes, setSelectedCardTypes] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState("price-high-low");

  // Filter collection entries for this collection
  const collectionEntries = USER_COLLECTION_ENTRIES.filter(
    (entry) => entry.collection_id === collectionId
  );

  // Get cards for this collection
  const cards: Card[] = GLOBAL_CARDS.filter((card) =>
    collectionEntries.some((entry) => entry.card_id === card.id)
  );

  // Merge cards with collection data
  type CardWithCollection = Card & {
    quantity: number;
    collectionId: string;
  };
  const cardsWithCollection: CardWithCollection[] = cards
    .map((card) => {
      const collection = collectionEntries.find((c) => c.card_id === card.id);
      if (!collection) return null;
      return {
        ...card,
        quantity: collection.quantity,
        collectionId: collection.id,
      };
    })
    .filter((card): card is CardWithCollection => card !== null);

  const filteredCards = cardsWithCollection
    .filter((card) => {
      // Apply search filter
      const matchesSearch = card.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Apply card type filter
      const matchesCardType =
        selectedCardTypes.length === 0 ||
        selectedCardTypes.includes(card.card_type.toLowerCase());

      // Apply rarity filter
      const matchesRarity =
        selectedRarities.length === 0 ||
        selectedRarities.includes(card.rarity.toLowerCase());

      // Apply set filter
      const matchesSet = selectedSet === "all" || card.set_abv === selectedSet;

      return matchesSearch && matchesCardType && matchesRarity && matchesSet;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (selectedSort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "price-high-low":
          return (b.price || 0) - (a.price || 0);
        case "price-low-high":
          return (a.price || 0) - (b.price || 0);
        case "set-number":
          // Sort by set abbreviation, then by card number if available
          const setCompare = a.set_abv.localeCompare(b.set_abv);
          if (setCompare !== 0) return setCompare;
          // If cards have a number property, sort by that, otherwise by name
          return a.name.localeCompare(b.name);
        case "quantity":
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

  const toggleCardType = (type: string) => {
    const lowerType = type.toLowerCase();
    setSelectedCardTypes((prev) =>
      prev.includes(lowerType)
        ? prev.filter((t) => t !== lowerType)
        : [...prev, lowerType]
    );
  };

  const toggleRarity = (rarity: string) => {
    setSelectedRarities((prev) =>
      prev.includes(rarity)
        ? prev.filter((r) => r !== rarity)
        : [...prev, rarity]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: collectionName,
          headerStyle: {
            backgroundColor: "#1e293b",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerRight: () => (
            <Pressable style={{ padding: 8, marginRight: 8 }}>
              <FontAwesome name="ellipsis-v" size={24} color="#ffffff" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={[]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome
            name="search"
            size={16}
            color="#64748b"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter and Sort Buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setShowFilter(true)}
          >
            <FontAwesome name="filter" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>FILTER</Text>
          </Pressable>
          <Pressable
            style={styles.sortButton}
            onPress={() => setShowSort(true)}
          >
            <FontAwesome name="sort" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>SORT</Text>
          </Pressable>
        </View>

        {/* Cards Grid */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.cardsGrid}>
            {filteredCards.map((card) => (
              <CardGridItem
                key={card.id}
                card={card}
                cardWidth={CARD_WIDTH}
                cardHeight={CARD_HEIGHT}
                onPress={() =>
                  router.push({
                    pathname: "/card-detail",
                    params: {
                      cardId: card.id,
                      collectionId,
                      cardIds: filteredCards.map((c) => c.id).join(","),
                    },
                  })
                }
              />
            ))}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <Pressable style={styles.fab}>
          <FontAwesome name="camera" size={28} color="#ffffff" />
        </Pressable>
      </SafeAreaView>

      {/* Filter Drawer */}
      <BottomDrawer
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filters"
        maxHeight="80%"
        headerRight={
          <Pressable
            onPress={() => {
              setSelectedCardTypes([]);
              setSelectedRarities([]);
              setSelectedSet("all");
            }}
          >
            <Text style={styles.resetButton}>Reset</Text>
          </Pressable>
        }
      >
        <View style={styles.filterDrawerContent}>
          {/* Card Type Section */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>CARD TYPE</Text>
            <View style={styles.pillContainer}>
              {Object.values(CardType).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.pill,
                    selectedCardTypes.includes(type.toLowerCase()) &&
                      styles.pillActive,
                  ]}
                  onPress={() => toggleCardType(type)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedCardTypes.includes(type.toLowerCase()) &&
                        styles.pillTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Rarity Section */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>RARITY</Text>
            {Object.values(CardRarity).map((rarity) => (
              <Pressable
                key={rarity}
                style={styles.checkboxOption}
                onPress={() => toggleRarity(rarity)}
              >
                <Text style={styles.checkboxLabel}>
                  {rarity === "showcase"
                    ? "Showcase"
                    : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    selectedRarities.includes(rarity) && styles.checkboxChecked,
                  ]}
                >
                  {selectedRarities.includes(rarity) && (
                    <FontAwesome name="check" size={14} color="#ffffff" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Set Section */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>SET</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {selectedSet === "all" ? "All Sets" : selectedSet}
              </Text>
              <FontAwesome name="chevron-down" size={14} color="#64748b" />
            </Pressable>
          </View>
        </View>
      </BottomDrawer>

      {/* Sort Drawer */}
      <BottomDrawer
        visible={showSort}
        onClose={() => setShowSort(false)}
        title="Sort Cards By"
        maxHeight="70%"
      >
        <View style={styles.sortDrawerContent}>
          <Pressable
            style={styles.sortOption}
            onPress={() => setSelectedSort("name-asc")}
          >
            <View style={styles.sortOptionLeft}>
              <View style={styles.sortIconContainer}>
                <Text style={styles.sortIconText}>ABC</Text>
              </View>
              <Text style={styles.sortOptionText}>Name (A-Z)</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedSort === "name-asc" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "name-asc" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>

          <Pressable
            style={styles.sortOption}
            onPress={() => setSelectedSort("price-high-low")}
          >
            <View style={styles.sortOptionLeft}>
              <View style={styles.sortIconContainer}>
                <FontAwesome name="dollar" size={14} color="#64748b" />
              </View>
              <Text style={styles.sortOptionText}>Price (High to Low)</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedSort === "price-high-low" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "price-high-low" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>

          <Pressable
            style={styles.sortOption}
            onPress={() => setSelectedSort("price-low-high")}
          >
            <View style={styles.sortOptionLeft}>
              <View style={styles.sortIconContainer}>
                <FontAwesome name="long-arrow-down" size={14} color="#64748b" />
              </View>
              <Text style={styles.sortOptionText}>Price (Low to High)</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedSort === "price-low-high" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "price-low-high" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>

          <Pressable
            style={styles.sortOption}
            onPress={() => setSelectedSort("set-number")}
          >
            <View style={styles.sortOptionLeft}>
              <View style={styles.sortIconContainer}>
                <FontAwesome name="hashtag" size={14} color="#64748b" />
              </View>
              <Text style={styles.sortOptionText}>Set Number</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedSort === "set-number" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "set-number" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>

          <Pressable
            style={styles.sortOption}
            onPress={() => setSelectedSort("quantity")}
          >
            <View style={styles.sortOptionLeft}>
              <View style={styles.sortIconContainer}>
                <FontAwesome name="th-large" size={13} color="#64748b" />
              </View>
              <Text style={styles.sortOptionText}>Quantity</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedSort === "quantity" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "quantity" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>
        </View>
      </BottomDrawer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    borderRadius: 8,
  },
  sortButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 100,
    gap: CARD_GAP,
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
  },
  cardPlaceholder: {
    width: "100%",
    height: "100%",
  },
  energyBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#3b82f6",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  energyText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  priceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#22c55e",
  },
  quantityBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#22c55e",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  foilBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
  },
  cardSet: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 2,
  },
  cardCondition: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  drawerContent: {
    paddingHorizontal: 20,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#ffffff",
  },
  filterDrawerContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  resetButton: {
    fontSize: 16,
    color: "#22c55e",
    fontWeight: "600",
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pillActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  pillTextActive: {
    color: "#ffffff",
  },
  checkboxOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#22c55e",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownText: {
    fontSize: 16,
    color: "#ffffff",
  },
  artistSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  artistInput: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
  },
  showResultsButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  showResultsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  sortDrawerContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  sortOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sortIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sortIconContainerGreen: {
    backgroundColor: "#22c55e",
  },
  sortIconText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  sortOptionText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#ffffff",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#22c55e",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
  },
  applySortButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  applySortText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
});
