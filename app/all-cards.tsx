import { CardGridItem } from "@/components/card-grid-item";
import { getCards } from "@/db/queries/cards";
import { Card } from "@/interfaces/card";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

export default function AllCards() {
  const [activeTab, setActiveTab] = useState<"cards" | "expansions">("cards");
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { width } = useWindowDimensions();
  const numColumns = Math.floor(width / 180);
  const cardWidth = (width - 40 - (numColumns - 1) * 16) / numColumns;

  // Fetch cards from local database with pagination
  const fetchCards = useCallback(async (page: number, query: string = "") => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const result = (await getCards(query || undefined, page)) as Card[];
      
      if (page === 1) {
        setCards(result);
      } else {
        setCards(prev => [...prev, ...result]);
      }
      
      // If we got less than 20 cards (PAGE_SIZE), we've reached the end
      setHasMore(result.length === 20);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setCurrentPage(1);
    setCards([]);
    setHasMore(true);
    fetchCards(1, searchQuery);
  }, [searchQuery]);

  // Load more cards when reaching the bottom
  const loadMoreCards = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCards(nextPage, searchQuery);
    }
  }, [currentPage, hasMore, loadingMore, loading, searchQuery, fetchCards]);

  // Render card item
  const renderCard = ({ item }: { item: Card }) => (
    <View style={styles.cardWrapper}>
      <CardGridItem
        card={item}
        cardWidth={cardWidth}
        cardHeight={cardWidth * 1.4}
        onPress={() => router.push(`/card-detail?id=${item.id}`)}
      />
    </View>
  );

  // Render header with search bar and tabs
  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
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
            {`${cards.length} ${cards.length === 1 ? "card" : "cards"} found${hasMore ? '+' : ''}`}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {activeTab === "cards" ? (
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMoreCards}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color="#22c55e" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#666" />
                <Text style={styles.emptyText}>No cards found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search
                </Text>
              </View>
            }
          />
        )
      ) : (
        <View style={styles.centered}>
          <Ionicons name="albums-outline" size={48} color="#666" />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtext}>
            Expansion browsing will be available soon
          </Text>
        </View>
      )}
    </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#888",
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#666",
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
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
