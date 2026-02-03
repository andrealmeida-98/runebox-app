import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { CardGridItem } from "@/components/card-grid-item";
import { SearchInput } from "@/components/search-input";
import { useShowError, useShowSuccess } from "@/contexts/notification-context";
import { getCards } from "@/db/queries/cards";
import {
  addCardToCollection,
  getCollectionEntries,
} from "@/db/queries/collection";
import { Card } from "@/interfaces/card";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_PADDING = 12;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function AddCardToCollectionScreen() {
  const { collectionId, collectionName } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>(
    {}
  );
  const [cards, setCards] = useState<Card[]>([]);
  const [collectionCardIds, setCollectionCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const showSuccess = useShowSuccess();
  const showError = useShowError();

  const name =
    typeof collectionName === "string" ? collectionName : "Collection";
  const collId = typeof collectionId === "string" ? collectionId : "";

  // Load collection entries
  useEffect(() => {
    loadCollectionEntries();
  }, [collectionId]);

  // Load cards when search query changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      loadCards();
    } else {
      setCards([]);
    }
  }, [searchQuery]);

  const loadCollectionEntries = async () => {
    try {
      const entries = await getCollectionEntries(collId);
      const cardIds = entries.map((entry: any) => entry.card_id);
      setCollectionCardIds(cardIds);
    } catch (error) {
      console.error("Error loading collection entries:", error);
    }
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const results = await getCards(searchQuery, 1);
      setCards(results);
    } catch (error) {
      console.error("Error loading cards:", error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter cards based on search query
  const filteredCards = cards.sort((a, b) => a.name.localeCompare(b.name));

  const getCardQuantity = (cardId: string) => {
    return cardQuantities[cardId] || 0;
  };

  const updateCardQuantity = (cardId: string, change: number) => {
    setCardQuantities((prev) => {
      const currentQuantity = prev[cardId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      return { ...prev, [cardId]: newQuantity };
    });
  };

  const getTotalCardsSelected = () => {
    return Object.values(cardQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const handleAddCards = async () => {
    const cardsToAdd = Object.entries(cardQuantities).filter(
      ([_, quantity]) => quantity > 0
    );

    if (cardsToAdd.length === 0) return;

    try {
      for (const [cardId, quantity] of cardsToAdd) {
        await addCardToCollection(collId, cardId, quantity);
      }

      console.log("Added cards to collection:", cardsToAdd);

      // Show success notification
      const totalAdded = getTotalCardsSelected();
      showSuccess(
        `Successfully added ${totalAdded} card${
          totalAdded !== 1 ? "s" : ""
        } to collection`
      );

      // Reset quantities
      setCardQuantities({});

      // Reload collection entries to update the badge
      await loadCollectionEntries();

      // Navigate back after a short delay to show the notification
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Error adding cards to collection:", error);
      showError("Failed to add cards to collection");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `Add to ${name}`,
          headerStyle: {
            backgroundColor: "#1e293b",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      />
      <SafeAreaView style={styles.container} edges={[]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchInput
            style={styles.searchInput}
            placeholder="Search cards to add..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        {/* Results Count */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredCards.length} card{filteredCards.length !== 1 ? "s" : ""}{" "}
              found
            </Text>
          </View>
        )}
        {/* Cards Grid */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {searchQuery.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="search" size={48} color="#475569" />
              <Text style={styles.emptyStateText}>
                Start typing to search for cards
              </Text>
            </View>
          ) : filteredCards.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="inbox" size={48} color="#475569" />
              <Text style={styles.emptyStateText}>No cards found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try a different search term
              </Text>
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {filteredCards.map((card) => {
                const isInCollection = collectionCardIds.includes(card.id);
                const quantity = getCardQuantity(card.id);
                return (
                  <View key={card.id} style={styles.cardWrapper}>
                    <CardGridItem
                      card={card}
                      cardWidth={CARD_WIDTH}
                      cardHeight={CARD_HEIGHT}
                      onPress={() => {}}
                    />
                    {isInCollection && (
                      <View style={styles.inCollectionBadge}>
                        <FontAwesome name="check" size={12} color="#ffffff" />
                        <Text style={styles.inCollectionText}>
                          In collection
                        </Text>
                      </View>
                    )}

                    {/* Quantity Controls */}
                    <View style={styles.quantityControls}>
                      <Button
                        size="tiny"
                        variant="secondary"
                        icon="minus"
                        onPress={() => updateCardQuantity(card.id, -1)}
                        disabled={quantity === 0}
                      />
                      <Text style={styles.quantityValue}>{quantity}</Text>
                      <Button
                        size="tiny"
                        variant="primary"
                        icon="plus"
                        onPress={() => updateCardQuantity(card.id, 1)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
        {/* Floating Add Button */}
        {getTotalCardsSelected() > 0 && (
          <View style={styles.floatingButtonContainer}>
            <Button
              variant="primary"
              size="large"
              icon="plus"
              onPress={handleAddCards}
            >
              {`Add ${getTotalCardsSelected()} Card${
                getTotalCardsSelected() !== 1 ? "s" : ""
              }`}
            </Button>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 32,
    gap: CARD_GAP,
  },
  cardWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  inCollectionBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  inCollectionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    paddingVertical: 8,
  },
  quantityButton: {
    borderRadius: "50%",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    minWidth: 32,
    textAlign: "center",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 24,
    left: "5%",
    right: "5%",
  },
  floatingAddButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingAddButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#cbd5e1",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },
});
