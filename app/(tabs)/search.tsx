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
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AllCards() {
  const router = useRouter();
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
    console.log(
      "Building filters object - Starting with empty filters:",
      filters,
    );

    const rarityFilter = activeFilters.find((f) => f.name === "rarity");
    if (rarityFilter?.value) {
      filters.rarity = rarityFilter.value;
      console.log(
        "Applied rarity filter:",
        { rarity: filters.rarity },
        "Current filters:",
        filters,
      );
    }

    const typeFilter = activeFilters.find((f) => f.name === "cardType");
    if (typeFilter?.value) {
      filters.cardType = typeFilter.value;
      console.log(
        "Applied cardType filter:",
        { cardType: filters.cardType },
        "Current filters:",
        filters,
      );
    }

    const setFilter = activeFilters.find((f) => f.name === "setAbv");
    if (setFilter?.value) {
      filters.setAbv = setFilter.value;
      console.log(
        "Applied setAbv filter:",
        { setAbv: filters.setAbv },
        "Current filters:",
        filters,
      );
    }

    const energyFilter = activeFilters.find((f) => f.name === "energy");
    if (energyFilter?.value && energyFilter.value > 0) {
      filters.energy = {
        value: energyFilter.value,
        operator: energyFilter.operator || ">=",
      };
      console.log(
        "Applied energy filter:",
        { energy: filters.energy },
        "Current filters:",
        filters,
      );
    }

    const mightFilter = activeFilters.find((f) => f.name === "might");
    if (mightFilter?.value && mightFilter.value > 0) {
      filters.might = {
        value: mightFilter.value,
        operator: mightFilter.operator || ">=",
      };
      console.log(
        "Applied might filter:",
        { might: filters.might },
        "Current filters:",
        filters,
      );
    }

    const domainFilter = activeFilters.find((f) => f.name === "domain");
    if (
      domainFilter?.value &&
      Array.isArray(domainFilter.value) &&
      domainFilter.value.length > 0
    ) {
      filters.domain = domainFilter.value;
      filters.domainOperator = domainFilter.domainOperator || "OR";
      console.log(
        "Applied domain filter:",
        { domain: filters.domain, domainOperator: filters.domainOperator },
        "Current filters:",
        filters,
      );
    }

    console.log("Final filters object:", filters);
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
        const hasFilters = Object.keys(filters).length > 0;
        const finalFilters = hasFilters ? filters : undefined;

        const result = (await getCardsBySetOrderedWithPagination(
          query || undefined,
          page,
          finalFilters,
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
    [getActiveFiltersObject],
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
    [cards],
  );

  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
  }, []);

  // Handle set navigation
  const handleSetPress = useCallback(
    (set: Set) => {
      router.push({
        pathname: "/set-detail",
        params: {
          setName: set.setName,
          setAbv: set.setAbv,
        },
      });
    },
    [router],
  );

  // Helper to capitalize first letter
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // Render sets list
  const renderSetsList = () => (
    <View style={styles.setsContainer}>
      {sets.map((set, index) => (
        <TouchableOpacity
          key={set.setAbv}
          style={styles.setItem}
          onPress={() => handleSetPress(set)}
        >
          <View style={styles.setInfo}>
            <Text style={styles.setName}>{set.setName}</Text>
            <Text style={styles.setAbbreviation}>{set.setAbv}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render search bar and tabs
  const renderSearchBar = () => (
    <>
      {/* Search Input */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search cards..."
        filters={[
          {
            name: "rarity",
            type: "select",
            value: activeFilters.find((f) => f.name === "rarity")?.value || "",
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
            value: activeFilters.find((f) => f.name === "setAbv")?.value || "",
            label: "Set",
            options: sets.map((s) => s.setName),
          },
          {
            name: "energy",
            type: "comparison",
            value: activeFilters.find((f) => f.name === "energy")?.value || 0,
            operator:
              activeFilters.find((f) => f.name === "energy")?.operator || ">=",
            label: "Cost (Energy)",
          },
          {
            name: "might",
            type: "comparison",
            value: activeFilters.find((f) => f.name === "might")?.value || 0,
            operator:
              activeFilters.find((f) => f.name === "might")?.operator || ">=",
            label: "Might",
          },
          {
            name: "domain",
            type: "domain",
            value: activeFilters.find((f) => f.name === "domain")?.value || [],
            domainOperator:
              activeFilters.find((f) => f.name === "domain")?.domainOperator ||
              "OR",
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "cards" && styles.activeTab]}
          onPress={() => setActiveTab("cards")}
        >
          <MaterialCommunityIcons name="cards" size={24} color="white" />
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
          <MaterialCommunityIcons
            name="cards-variant"
            size={24}
            color="white"
          />
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
      {activeTab === "expansions" && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {`${sets.length} ${
              sets.length === 1 ? "expansion" : "expansions"
            } found`}
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
        renderSetsList()
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
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
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
    gap: 8,
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
  setsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  setItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  setInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  setAbbreviation: {
    fontSize: 14,
    color: "#888",
  },
});
