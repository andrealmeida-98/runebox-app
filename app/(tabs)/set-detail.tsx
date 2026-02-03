import { CardFlatList } from "@/components/card-flat-list";
import { CardPreviewOverlay } from "@/components/card-preview-overlay";
import { SearchInput } from "@/components/search-input";
import { getStandardHeaderOptions } from "@/constants/header-options";
import { getCardsBySetOrderedWithPagination } from "@/db/queries/cards";
import { Card } from "@/interfaces/card";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SetDetailScreen() {
  const { setName, setAbv } = useLocalSearchParams();
  const router = useRouter();

  const setNameStr = typeof setName === "string" ? setName : "";
  const setAbvStr = typeof setAbv === "string" ? setAbv : "";

  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Card preview overlay state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewCards, setPreviewCards] = useState<Card[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Fetch cards from the specific set
  const fetchCards = useCallback(
    async (page: number, query: string = "") => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // Filter by the specific set
        const filters = { setAbv: setAbvStr };

        const result = (await getCardsBySetOrderedWithPagination(
          query || undefined,
          page,
          filters,
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
    [setAbvStr],
  );

  // Initial load and reload when search changes
  useEffect(() => {
    setCurrentPage(1);
    setCards([]);
    setHasMore(true);
    fetchCards(1, searchQuery);
  }, [searchQuery, fetchCards]);

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: setNameStr,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/search")}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          ...getStandardHeaderOptions(setNameStr, undefined, "dark"),
        }}
      />

      <View style={{ marginTop: -48 }}>
        {/* Search Input */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search in ${setNameStr}...`}
        />
      </View>
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}

      {/* Results count */}
      {!loading && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {`${cards.length} ${cards.length === 1 ? "card" : "cards"} found${
              hasMore ? "+" : ""
            }`}
          </Text>
        </View>
      )}

      {/* Cards List */}
      <CardFlatList
        cards={cards}
        loading={loading}
        loadingMore={loadingMore}
        onEndReached={loadMoreCards}
        onCardPress={handleCardPreview}
        numColumns={3}
        emptyMessage={`No cards found in ${setNameStr}`}
        emptySubtext="Try adjusting your search"
      />

      {/* Card Preview Overlay */}
      <CardPreviewOverlay
        visible={previewVisible}
        cards={previewCards}
        initialIndex={previewIndex}
        onClose={handleClosePreview}
        singleCardMode={cards.length > 50}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  resultsText: {
    color: "#888",
    fontSize: 14,
  },
});
