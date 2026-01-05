import { CardFlatList } from "@/components/card-flat-list";
import { CardPreviewOverlay } from "@/components/card-preview-overlay";
import { Filter, SearchInput } from "@/components/search-input";
import {
  CardFilters,
  getCardsBySetOrderedWithPagination,
} from "@/db/queries/cards";
import { getSets } from "@/db/queries/sets";
import { Card, CardDomain, CardRarity, CardType } from "@/interfaces/card";
import { Set } from "@/interfaces/set";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AllCards() {
  const [activeTab, setActiveTab] = useState<"cards" | "expansions">("cards");
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [sets, setSets] = useState<Set[]>([]);

  // Fetch sets on mount
  useEffect(() => {
    getSets().then(setSets).catch(console.error);
  }, []);

  // Card preview overlay state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewCards, setPreviewCards] = useState<Card[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Convert filters array to CardFilters object
  const getActiveFiltersObject = useCallback((): CardFilters => {
    const filters: CardFilters = {};

    const rarityFilter = activeFilters.find((f) => f.name === "rarity");
    if (rarityFilter?.value) {
      filters.rarity = rarityFilter.value;
    }

    const typeFilter = activeFilters.find((f) => f.name === "cardType");
    if (typeFilter?.value) {
      filters.cardType = typeFilter.value;
    }

    const setFilter = activeFilters.find((f) => f.name === "setAbv");
    if (setFilter?.value) {
      filters.setAbv = setFilter.value;
    }

    const energyFilter = activeFilters.find((f) => f.name === "energy");
    if (energyFilter?.value && energyFilter.value > 0) {
      filters.energy = {
        value: energyFilter.value,
        operator: energyFilter.operator || ">=",
      };
    }

    const mightFilter = activeFilters.find((f) => f.name === "might");
    if (mightFilter?.value && mightFilter.value > 0) {
      filters.might = {
        value: mightFilter.value,
        operator: mightFilter.operator || ">=",
      };
    }

    const domainFilter = activeFilters.find((f) => f.name === "domain");
    if (
      domainFilter?.value &&
      Array.isArray(domainFilter.value) &&
      domainFilter.value.length > 0
    ) {
      filters.domain = domainFilter.value;
      filters.domainOperator = domainFilter.domainOperator || "OR";
    }

    return filters;
  }, [activeFilters]);

  // Fetch cards from local database with pagination
  const fetchCards = useCallback(
    async (page: number, query: string = "") => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const filters = getActiveFiltersObject();
        const result = (await getCardsBySetOrderedWithPagination(
          query || undefined,
          page,
          Object.keys(filters).length > 0 ? filters : undefined
        )) as Card[];

        if (page === 1) {
          setCards(result);
        } else {
          setCards((prev) => [...prev, ...result]);
        }

        // If we got less than 20 cards (PAGE_SIZE), we've reached the end
        setHasMore(result.length === 20);
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [getActiveFiltersObject]
  );

  // Initial load and reload when filters change
  useEffect(() => {
    setCurrentPage(1);
    setCards([]);
    setHasMore(true);
    fetchCards(1, searchQuery);
  }, [searchQuery, activeFilters]);

  // Load more cards when reaching the bottom
  const loadMoreCards = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCards(nextPage, searchQuery);
    }
  }, [currentPage, hasMore, loadingMore, loading, searchQuery, fetchCards]);

  // Card preview handlers
  const handleCardPreview = useCallback(
    (card: Card) => {
      const cardIndex = cards.findIndex((c) => c.id === card.id);
      setPreviewCards(cards);
      setPreviewIndex(cardIndex >= 0 ? cardIndex : 0);
      setPreviewVisible(true);
    },
    [cards]
  );

  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
  }, []);

  // Helper to capitalize first letter
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // Render search bar and tabs
  const renderSearchBar = () => (
    <>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cards..."
            filters={[
              {
                name: "rarity",
                type: "select",
                value:
                  activeFilters.find((f) => f.name === "rarity")?.value || "",
                label: "Rarity",
                options: [
                  capitalize(CardRarity.COMMON),
                  capitalize(CardRarity.UNCOMMON),
                  capitalize(CardRarity.RARE),
                  capitalize(CardRarity.EPIC),
                  capitalize(CardRarity.SHOWCASE),
                ],
              },
              {
                name: "cardType",
                type: "select",
                value:
                  activeFilters.find((f) => f.name === "cardType")?.value || "",
                label: "Card Type",
                options: Object.values(CardType),
              },
              {
                name: "setAbv",
                type: "select",
                value:
                  activeFilters.find((f) => f.name === "setAbv")?.value || "",
                label: "Set",
                options: sets.map((s) => s.setName),
              },
              {
                name: "energy",
                type: "comparison",
                value:
                  activeFilters.find((f) => f.name === "energy")?.value || 0,
                operator:
                  activeFilters.find((f) => f.name === "energy")?.operator ||
                  ">=",
                label: "Cost (Energy)",
              },
              {
                name: "might",
                type: "comparison",
                value:
                  activeFilters.find((f) => f.name === "might")?.value || 0,
                operator:
                  activeFilters.find((f) => f.name === "might")?.operator ||
                  ">=",
                label: "Might",
              },
              {
                name: "domain",
                type: "domain",
                value:
                  activeFilters.find((f) => f.name === "domain")?.value || [],
                label: "Domain",
                options: Object.values(CardDomain),
                images: {
                  [CardDomain.ORDER]: require("@/assets/icons/order.webp"),
                  [CardDomain.CALM]: require("@/assets/icons/calm.webp"),
                  [CardDomain.CHAOS]: require("@/assets/icons/chaos.webp"),
                  [CardDomain.MIND]: require("@/assets/icons/mind.webp"),
                  [CardDomain.BODY]: require("@/assets/icons/body.webp"),
                },
              },
            ]}
            onFiltersChange={(updatedFilters) => {
              setActiveFilters(updatedFilters);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "cards" && styles.activeTab]}
          onPress={() => setActiveTab("cards")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "cards" && styles.activeTabText,
            ]}
          >
            Cards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "expansions" && styles.activeTab]}
          onPress={() => setActiveTab("expansions")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "expansions" && styles.activeTabText,
            ]}
          >
            Expansions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results count */}
      {activeTab === "cards" && !loading && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {`${cards.length} ${cards.length === 1 ? "card" : "cards"} found${
              hasMore ? "+" : ""
            }`}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <Button onPress={() => console.log(activeFilters)}>SEE FILTER</Button>
      {renderSearchBar()}

      {activeTab === "cards" ? (
        <CardFlatList
          cards={cards}
          loading={loading}
          loadingMore={loadingMore}
          onEndReached={loadMoreCards}
          onCardPress={handleCardPreview}
          numColumns={3}
          emptyMessage="No cards found"
          emptySubtext="Try adjusting your search or filters"
        />
      ) : (
        <View style={styles.centered}>
          <Ionicons name="albums-outline" size={48} color="#666" />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtext}>
            Expansion browsing will be available soon
          </Text>
        </View>
      )}

      {/* Card Preview Overlay */}
      <CardPreviewOverlay
        visible={previewVisible}
        cards={previewCards}
        initialIndex={previewIndex}
        onClose={handleClosePreview}
        singleCardMode={cards.length > 50} // Enable single card mode for large lists
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    marginTop: 24,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    color: "#888",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    paddingVertical: 12,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#22c55e",
  },
  tabText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  resultsText: {
    color: "#888",
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  comingSoonText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#888",
  },
  comingSoonSubtext: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
