import { CardGridItem } from "@/components/card-grid-item";
import {
  getCards,
  getCardsBySetAbv,
  getCardsWithMostVariation,
} from "@/db/queries/cards";
import { getSets } from "@/db/queries/sets";
import { Card } from "@/interfaces/card";
import { Set } from "@/interfaces/set";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CardSearch() {
  const [cards, setCards] = useState<Card[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingCards, setTrendingCards] = useState<Card[]>([]);
  const [recentSets, setRecentSets] = useState<Set[]>([]);
  const [setCardsMap, setSetCardsMap] = useState<Record<string, Card[]>>({});
  const [selectedCategory, setSelectedCategory] = useState("Trending");

  // Card preview overlay state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewCards, setPreviewCards] = useState<Card[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const categories = ["Trending", "New Sets", "Full Art", "Promo"];

  // Fetch trending cards (top 3 with highest price gains)
  const fetchTrendingCards = useCallback(async () => {
    try {
      const response = await getCardsWithMostVariation(3);
      setTrendingCards(response);
    } catch (error) {
      console.error("Error fetching trending cards:", error);
    }
  }, []);

  // Fetch recent sets
  const fetchRecentSets = useCallback(async () => {
    try {
      const response = await getSets();
      // Get only the last 2 sets
      const lastTwoSets = response.slice(-2);
      setRecentSets(lastTwoSets);

      // Fetch cards for each set
      const cardsMap: Record<string, Card[]> = {};
      for (const set of lastTwoSets) {
        try {
          const cards = await getCardsBySetAbv(set.setAbv, 5);
          // Sort by price descending and take top 5
          const sortedCards = cards
            .filter((card) => card.price && card.price > 0)
            .sort((a, b) => (b.price || 0) - (a.price || 0))
            .slice(0, 5);
          cardsMap[set.setAbv] = sortedCards;
        } catch (error) {
          console.error(`Error fetching cards for set ${set.setAbv}:`, error);
          cardsMap[set.setAbv] = [];
        }
      }
      setSetCardsMap(cardsMap);
    } catch (error) {
      console.error("Error fetching recent sets:", error);
    }
  }, []);

  // Fetch cards
  const fetchCards = useCallback(
    async (pageNum: number, searchQuery: string, isRefresh = false) => {
      if (pageNum === 1 && !isRefresh) {
        setLoading(true);
      } else if (!isRefresh) {
        setLoadingMore(true);
      }

      try {
        const data = await getCards(searchQuery, pageNum);

        if (pageNum === 1) {
          setCards(data);
        } else {
          setCards((prev) => [...prev, ...data]);
        }

        // Se retornar menos de 40 items, não há mais páginas
        setHasMore(data.length === 40);
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Load initial data
  useEffect(() => {
    fetchTrendingCards();
    fetchRecentSets();
  }, [fetchTrendingCards, fetchRecentSets]);

  // Card preview handlers
  const handleCardPreview = useCallback((card: Card, cardList: Card[]) => {
    const cardIndex = cardList.findIndex((c) => c.id === card.id);
    setPreviewCards(cardList);
    setPreviewIndex(cardIndex >= 0 ? cardIndex : 0);
    setPreviewVisible(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
  }, []);

  // Search handler (reset to page 1)
  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      setPage(1);
      setHasMore(true);
      fetchCards(1, text);
    },
    [fetchCards]
  );

  // Load more (infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCards(nextPage, query);
    }
  }, [loadingMore, hasMore, loading, page, query, fetchCards]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchCards(1, query, true);
    fetchTrendingCards();
    fetchRecentSets();
  }, [query, fetchCards, fetchTrendingCards, fetchRecentSets]);

  // Render trending card
  const renderTrendingCard = ({ item }: { item: Card }) => (
    <TouchableOpacity
      style={styles.trendingCard}
      onPress={() => handleCardPreview(item, trendingCards)}
    >
      <CardGridItem card={item} hidePrice />

      <View style={styles.trendingInfo}>
        <Text style={styles.trendingPrice}>${item.price}</Text>
        {item.price_change && item.price_change > 0 && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotText}>HOT</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render each search result card
  const renderCard = ({ item }: { item: Card }) => (
    <CardGridItem
      card={item}
      cardHeight={300}
      cardWidth={100}
      onPress={() => handleCardPreview(item, cards)}
    />
  );

  // Footer with loading indicator
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  };

  // Render main content when not searching
  const renderMainContent = () => (
    <ScrollView
      style={styles.mainContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Trending Now Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={20} color="#22c55e" />
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <TouchableOpacity onPress={() => router.push("/all-cards")}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={trendingCards}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderTrendingCard}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Recent Sets Section */}
      {recentSets.map((set, setIndex) => {
        const cards = setCardsMap[set.setAbv] || [];
        // Get top 5 cards by price
        const topCards = cards.slice(0, 5);

        return (
          <View key={set.setAbv} style={styles.section}>
            <View style={styles.setHeader}>
              <Text style={styles.setTitle}>{set.setName}</Text>
            </View>
            <View style={styles.setCardsContainer}>
              {/* First Row - 3 cards */}
              <View style={styles.setCardsRow}>
                {topCards.slice(0, 3).map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.setCard}
                    onPress={() => handleCardPreview(card, cards)}
                  >
                    <Image
                      source={{ uri: card.image_url }}
                      style={styles.setImage}
                    />
                    <Text style={styles.setCardName} numberOfLines={1}>
                      {card.name}
                    </Text>
                    <Text style={styles.setCardRarity}>{card.set_abv}</Text>
                    <Text style={styles.setCardPrice}>${card.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Second Row - 2 cards + 1 "View All" */}
              <View style={styles.setCardsRow}>
                {topCards.slice(3, 5).map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.setCard}
                    onPress={() => handleCardPreview(card, cards)}
                  >
                    <Image
                      source={{ uri: card.image_url }}
                      style={styles.setImage}
                    />
                    <Text style={styles.setCardName} numberOfLines={1}>
                      {card.name}
                    </Text>
                    <Text style={styles.setCardRarity}>{card.set_abv}</Text>
                    <Text style={styles.setCardPrice}>${card.price}</Text>
                  </TouchableOpacity>
                ))}
                {/* View All placeholder */}
                <TouchableOpacity
                  style={styles.setCard}
                  onPress={() => router.push(`/collection-detail`)}
                >
                  <View style={styles.viewAllCard}>
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                    <Text style={styles.viewAllText}>View Set</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    // <View style={styles.container}>
    //   {/* Header */}
    //   <View style={styles.header}>
    //     <Text style={styles.headerTitle}>Search</Text>
    //     <TouchableOpacity>
    //       <Ionicons name="qr-code-outline" size={24} color="#fff" />
    //     </TouchableOpacity>
    //   </View>

    //   {/* Search Input */}
    //   <View style={styles.searchContainer}>
    //     <View style={styles.searchInputContainer}>
    //       <Ionicons
    //         name="search"
    //         size={20}
    //         color="#666"
    //         style={styles.searchIcon}
    //       />
    //       <TextInput
    //         style={styles.searchInput}
    //         placeholder="Card name, set, or #id"
    //         placeholderTextColor="#666"
    //         value={query}
    //         onChangeText={handleSearch}
    //         autoCapitalize="none"
    //         autoCorrect={false}
    //       />
    //     </View>
    //     <TouchableOpacity style={styles.filterButton}>
    //       <Ionicons name="options" size={20} color="#666" />
    //     </TouchableOpacity>
    //   </View>

    //   {/* Category Buttons */}
    //   <View style={styles.categoryContainer}>
    //     {categories.map((category) => (
    //       <TouchableOpacity
    //         key={category}
    //         style={[
    //           styles.categoryButton,
    //           selectedCategory === category && styles.selectedCategoryButton,
    //         ]}
    //         onPress={() => setSelectedCategory(category)}
    //       >
    //         <Text
    //           style={[
    //             styles.categoryText,
    //             selectedCategory === category && styles.selectedCategoryText,
    //           ]}
    //         >
    //           {category}
    //         </Text>
    //       </TouchableOpacity>
    //     ))}
    //   </View>

    //   {/* Content */}
    //   {query ? (
    //     // Show search results
    //     loading ? (
    //       <View style={styles.centered}>
    //         <ActivityIndicator size="large" color="#333" />
    //       </View>
    //     ) : (
    //       <FlatList
    //         data={cards}
    //         keyExtractor={(item) => item.id}
    //         renderItem={renderCard}
    //         onEndReached={handleLoadMore}
    //         onEndReachedThreshold={0.5}
    //         ListFooterComponent={renderFooter}
    //         ListEmptyComponent={
    //           <Text style={styles.emptyText}>No cards found</Text>
    //         }
    //       />
    //     )
    //   ) : (
    //     // Show main content
    //     renderMainContent()
    //   )}

    //   {/* Card Preview Overlay */}
    //   <CardPreviewOverlay
    //     visible={previewVisible}
    //     cards={previewCards}
    //     initialIndex={previewIndex}
    //     onClose={handleClosePreview}
    //   />
    // </View>
    <></>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a2332",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#1a2332",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
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
  filterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedCategoryButton: {
    backgroundColor: "#22c55e",
  },
  categoryText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  mainContent: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
    flex: 1,
  },
  viewAll: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "500",
  },
  horizontalList: {
    paddingLeft: 20,
  },
  trendingCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    position: "relative",
  },
  trendingInfo: {
    marginTop: 8,
  },
  trendingPrice: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "700",
  },
  hotBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ff4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  setHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  setTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  setCardsContainer: {
    paddingHorizontal: 20,
  },
  setCardsRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  setCard: {
    flex: 1,
    maxWidth: "31%",
  },
  setImage: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 8,
    backgroundColor: "#333",
    marginBottom: 8,
  },
  setCardName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  setCardRarity: {
    color: "#888",
    fontSize: 10,
    marginBottom: 4,
  },
  setCardPrice: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  viewAllCard: {
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: "rgba(34, 197, 94, 0.8)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#22c55e",
    borderStyle: "dashed",
  },
  viewAllText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#888",
  },
});
