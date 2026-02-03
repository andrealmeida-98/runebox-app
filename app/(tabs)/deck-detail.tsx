import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { CardCollectionPreviewModal } from "@/components/card-collection-preview-modal";
import { ModalDialog } from "@/components/modal";
import { SearchInput } from "@/components/search-input";
import { Colors } from "@/constants/theme";
import {
  useShowError,
  useShowInfo,
  useShowSuccess,
} from "@/contexts/notification-context";
import { useTheme } from "@/contexts/theme-context";
import {
  deleteDeck,
  getDeckById,
  getDeckEntriesWithCards,
  importCardsToDeck,
  parseCardImportText,
  removeCardFromDeck,
  updateCardQuantityInDeck,
} from "@/db/queries/deck";
import { Card, CardDomain, CardType } from "@/interfaces/card";
import { Deck } from "@/interfaces/deck";
import { getThemeColors } from "@/utils/theme-utils";

export default function DeckDetailScreen() {
  const { deckId } = useLocalSearchParams();
  const deckIdStr = typeof deckId === "string" ? deckId : "";
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<
    { card: Card; quantity: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"deck" | "stats">("deck");
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    quantity: number;
  } | null>(null);

  const showSuccess = useShowSuccess();
  const showError = useShowError();
  const showInfo = useShowInfo();

  const loadDeckData = useCallback(async () => {
    try {
      setLoading(true);
      const deckData = (await getDeckById(deckIdStr)) as Deck | null;
      setDeck(deckData);

      const entries = await getDeckEntriesWithCards(deckIdStr);
      const cardsWithQuantity = entries.map((entry: any) => ({
        card: {
          id: entry.card_id,
          name: entry.name,
          card_type: entry.card_type,
          rarity: entry.rarity,
          energy: entry.energy,
          might: entry.might,
          power: entry.power,
          domain: entry.domain ? JSON.parse(entry.domain) : [],
          tags: entry.tags ? JSON.parse(entry.tags) : [],
          ability: entry.ability,
          price: entry.price,
          price_foil: entry.price_foil,
          price_change: entry.price_change,
          set_name: entry.set_name,
          set_abv: entry.set_abv,
          image_url: entry.image_url,
        } as Card,
        quantity: entry.quantity,
      }));
      setDeckCards(cardsWithQuantity);
    } catch (error) {
      console.error("Error loading deck:", error);
    } finally {
      setLoading(false);
    }
  }, [deckIdStr]);

  const handleDeleteDeck = useCallback(async () => {
    if (!deck) return;

    setIsDeleting(true);
    try {
      await deleteDeck(deck.id);
      showSuccess("Deck deleted successfully");
      setShowDeleteModal(false);
      // Navigate back after a short delay
      setTimeout(() => {
        router.push("/decks");
      }, 500);
    } catch (error) {
      console.error("Error deleting deck:", error);
      showError("Failed to delete deck");
    } finally {
      setIsDeleting(false);
    }
  }, [deck, showSuccess, showError]);

  const handleImport = useCallback(async () => {
    if (!importText.trim()) {
      showError("Please enter card data to import");
      return;
    }

    setIsImporting(true);
    try {
      const parsedCards = parseCardImportText(importText);

      if (parsedCards.length === 0) {
        showError("No valid cards found in the import text");
        return;
      }

      const result = await importCardsToDeck(deckIdStr, parsedCards);

      if (result.errors.length > 0) {
        showError(
          `Success: ${result.totalQuantity} card(s), Failed: ${result.failed}. Check console for errors.`,
        );
        console.log("Import errors:", result.errors.slice(0, 10).join("\n"));
      } else {
        showSuccess(`Imported ${result.totalQuantity} card(s) successfully`);
      }

      setImportText("");
      setShowImportModal(false);
      await loadDeckData();
    } catch (error) {
      showError(`Failed to import cards: ${error}`);
    } finally {
      setIsImporting(false);
    }
  }, [importText, deckIdStr, loadDeckData, showSuccess, showError]);

  const handleIncreaseQuantity = useCallback(
    async (cardId: string, currentQuantity: number, cardName: string) => {
      try {
        // Optimistically update the UI
        setDeckCards((prevCards) =>
          prevCards.map((item) =>
            item.card.id === cardId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );

        // Update in database (fire and forget - assume success)
        updateCardQuantityInDeck(deckIdStr, cardId, currentQuantity + 1).catch(
          (error) => {
            console.error("Error increasing quantity:", error);
            // Revert the optimistic update on error
            loadDeckData();
          },
        );

        showSuccess(`Added 1 ${cardName}`);
      } catch (error) {
        console.error("Error increasing quantity:", error);
        showError("Failed to update card quantity");
      }
    },
    [deckIdStr, loadDeckData, showSuccess, showError],
  );

  const handleDecreaseQuantity = useCallback(
    async (cardId: string, currentQuantity: number, cardName: string) => {
      try {
        const newQuantity = currentQuantity - 1;

        if (newQuantity <= 0) {
          // Optimistically remove the card from UI
          setDeckCards((prevCards) =>
            prevCards.filter((item) => item.card.id !== cardId),
          );

          // Update in database (fire and forget - assume success)
          removeCardFromDeck(deckIdStr, cardId).catch((error) => {
            console.error("Error removing card:", error);
            // Revert the optimistic update on error
            loadDeckData();
          });

          showSuccess(`Removed ${cardName} from deck`);
        } else {
          // Optimistically update the UI
          setDeckCards((prevCards) =>
            prevCards.map((item) =>
              item.card.id === cardId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            ),
          );

          // Update in database (fire and forget - assume success)
          updateCardQuantityInDeck(deckIdStr, cardId, newQuantity).catch(
            (error) => {
              console.error("Error decreasing quantity:", error);
              // Revert the optimistic update on error
              loadDeckData();
            },
          );

          showSuccess(`Removed 1 ${cardName}`);
        }
      } catch (error) {
        console.error("Error decreasing quantity:", error);
        showError("Failed to update card quantity");
      }
    },
    [deckIdStr, loadDeckData, showSuccess, showError],
  );

  useEffect(() => {
    loadDeckData();
  }, [loadDeckData]);

  // Update selectedCard when deckCards changes and modal is open
  useEffect(() => {
    if (showCardPreview && selectedCard) {
      // Find the updated card in the new deckCards
      const updatedCard = deckCards.find(
        (item) => item.card.id === selectedCard.card.id,
      );
      if (updatedCard) {
        setSelectedCard(updatedCard);
      }
    }
  }, [deckCards, showCardPreview, selectedCard]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading deck...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deck) {
    return null;
  }

  // Filter cards based on search query
  const filteredDeckCards = deckCards.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.card.name.toLowerCase().includes(query) ||
      item.card.id.toLowerCase().includes(query) ||
      item.card.card_type.toLowerCase().includes(query) ||
      item.card.rarity.toLowerCase().includes(query) ||
      item.card.set_name?.toLowerCase().includes(query) ||
      item.card.set_abv?.toLowerCase().includes(query)
    );
  });

  // Group cards by type
  const cardsByType: Record<CardType, { card: Card; quantity: number }[]> = {
    [CardType.CHAMPION]: [],
    [CardType.LEGEND]: [],
    [CardType.UNIT]: [],
    [CardType.SPELL]: [],
    [CardType.GEAR]: [],
    [CardType.RUNE]: [],
    [CardType.BATTLEFIELD]: [],
    [CardType.TOKEN]: [],
  };

  filteredDeckCards.forEach((item) => {
    cardsByType[item.card.card_type].push(item);
  });

  const getDomainImage = (domain: string) => {
    switch (domain) {
      case CardDomain.ORDER:
        return require("@/assets/icons/order.webp");
      case CardDomain.CALM:
        return require("@/assets/icons/calm.webp");
      case CardDomain.CHAOS:
        return require("@/assets/icons/chaos.webp");
      case CardDomain.MIND:
        return require("@/assets/icons/mind.webp");
      case CardDomain.BODY:
        return require("@/assets/icons/body.webp");
      default:
        return null;
    }
  };

  const renderCardItem = (item: { card: Card; quantity: number }) => {
    return (
      <Pressable
        key={item.card.id}
        style={[
          styles.cardItem,
          {
            backgroundColor: colors.cardItemBackground,
            borderColor: colors.cardItemBorder,
          },
        ]}
        onPress={() => {
          setSelectedCard(item);
          setShowCardPreview(true);
        }}
      >
        {/* Card Image */}
        <View style={styles.cardImageContainer}>
          <Image
            source={
              item.card.image_url
                ? { uri: item.card.image_url }
                : require("@/assets/images/back-image.png")
            }
            style={styles.cardImage}
            resizeMode="cover"
          />
          {/* Price Badge */}
          {(item.card.price || item.card.price_foil) && (
            <View style={styles.cardPriceBadge}>
              <Text style={[styles.cardPriceText, { color: colors.success }]}>
                {(item.card.price || item.card.price_foil || 0).toFixed(2)}€
              </Text>
            </View>
          )}
        </View>

        {/* Card Name */}
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.card.name}
          </Text>
          <Text style={[styles.cardId, { color: colors.icon }]}>
            {item.card.id}
          </Text>
          <View style={styles.domainIconsRow}>
            {item.card.domain?.map((domain) => {
              const domainImage = getDomainImage(domain);
              if (!domainImage) return null;
              return (
                <Image
                  key={domain}
                  source={domainImage}
                  style={styles.domainIcon}
                  resizeMode="contain"
                />
              );
            })}
          </View>
        </View>

        {/* Quantity Controls */}
        <View style={styles.quantityControls}>
          <Pressable
            style={[
              styles.quantityButton,
              {
                backgroundColor: colors.infoBackground,
                borderColor: colors.tint,
              },
            ]}
            onPress={() =>
              handleDecreaseQuantity(
                item.card.id,
                item.quantity,
                item.card.name,
              )
            }
          >
            <Text style={[styles.quantityButtonText, { color: colors.tint }]}>
              -
            </Text>
          </Pressable>
          <Text style={[styles.quantityText, { color: colors.text }]}>
            {item.quantity}
          </Text>
          <Pressable
            style={[
              styles.quantityButton,
              {
                backgroundColor: colors.infoBackground,
                borderColor: colors.tint,
              },
            ]}
            onPress={() =>
              handleIncreaseQuantity(
                item.card.id,
                item.quantity,
                item.card.name,
              )
            }
          >
            <Text style={[styles.quantityButtonText, { color: colors.tint }]}>
              +
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderSection = (
    title: string,
    cards: { card: Card; quantity: number }[],
  ) => {
    if (cards.length === 0) return null;

    const count = cards.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cards.reduce(
      (sum, item) =>
        sum + (item.card.price || item.card.price_foil || 0) * item.quantity,
      0,
    );

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.sectionHeaderText }]}
          >
            {title}
          </Text>
          <View
            style={[
              styles.sectionStats,
              {
                backgroundColor: colors.sectionStatsBackground,
              },
            ]}
          >
            <Text style={[styles.sectionStatsTextTop, { color: colors.text }]}>
              {count} {count === 1 ? "card" : "cards"}
            </Text>
            <Text
              style={[styles.sectionStatsTextBottom, { color: colors.icon }]}
            >
              {totalPrice.toFixed(2)}€
            </Text>
          </View>
        </View>
        <View style={styles.sectionContent}>
          {cards.map((item) => renderCardItem(item))}
        </View>
      </View>
    );
  };

  const { cardBackground } = getThemeColors(theme);

  return (
    <>
      <Stack.Screen
        options={{
          title: deck.name,
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.push("/decks")}
              style={{ padding: 8 }}
            >
              <FontAwesome name="arrow-left" size={20} color={colors.text} />
            </Pressable>
          ),
          headerShown: true,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={[]}
      >
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "deck" && styles.activeTab]}
            onPress={() => setActiveTab("deck")}
          >
            <FontAwesome
              name="clone"
              size={18}
              color={activeTab === "deck" ? "#fff" : "#888"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "deck" && styles.activeTabText,
              ]}
            >
              Deck
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "stats" && styles.activeTab]}
            onPress={() => setActiveTab("stats")}
          >
            <FontAwesome
              name="bar-chart"
              size={18}
              color={activeTab === "stats" ? "#fff" : "#888"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "stats" && styles.activeTabText,
              ]}
            >
              Stats
            </Text>
          </Pressable>
        </View>

        {/* Deck Tab Content */}
        {activeTab === "deck" && (
          <>
            <View style={{ marginTop: -16 }}>
              {/* Search Bar */}
              <SearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search cards in deck..."
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100, marginTop: -24 }}
            >
              {/* Empty State */}
              {filteredDeckCards.length === 0 && (
                <View style={styles.emptyState}>
                  <FontAwesome name="inbox" size={64} color={colors.icon} />
                  <Text
                    style={[styles.emptyStateTitle, { color: colors.text }]}
                  >
                    {searchQuery ? "No cards found" : "No cards in deck"}
                  </Text>
                  <Text
                    style={[
                      styles.emptyStateDescription,
                      { color: colors.icon },
                    ]}
                  >
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Add cards to get started"}
                  </Text>
                </View>
              )}

              {/* Card Categories */}
              {renderSection("CHAMPION", cardsByType[CardType.CHAMPION])}
              {renderSection("LEGEND", cardsByType[CardType.LEGEND])}
              {renderSection("UNITS", cardsByType[CardType.UNIT])}
              {renderSection("SPELLS", cardsByType[CardType.SPELL])}
              {renderSection("GEAR", cardsByType[CardType.GEAR])}
              {renderSection("RUNES", cardsByType[CardType.RUNE])}
              {renderSection("BATTLEFIELDS", cardsByType[CardType.BATTLEFIELD])}
              {renderSection("TOKENS", cardsByType[CardType.TOKEN])}
            </ScrollView>
          </>
        )}

        {/* Stats Tab Content */}
        {activeTab === "stats" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.statsContainer}>
              {/* Deck Value */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: cardBackground,
                    borderColor:
                      theme === "dark"
                        ? "rgba(100, 116, 139, 0.15)"
                        : "rgba(100, 116, 139, 0.2)",
                  },
                ]}
              >
                <Text style={[styles.statCardTitle, { color: colors.text }]}>
                  Deck Value
                </Text>
                <Text style={[styles.statCardValue, { color: colors.tint }]}>
                  {deckCards
                    .reduce(
                      (sum, item) =>
                        sum + (item.card.price || 0) * item.quantity,
                      0,
                    )
                    .toFixed(2)}
                  €
                </Text>
                <Text style={[styles.statCardSubtext, { color: colors.icon }]}>
                  Total cards:{" "}
                  {deckCards.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>

              {/* Energy Curve by Cost */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: cardBackground,
                    borderColor: colors.cardItemBorder,
                  },
                ]}
              >
                <Text style={[styles.statCardTitle, { color: colors.text }]}>
                  Energy Curve
                </Text>
                <View style={styles.energyCurveContainer}>
                  {Array.from({ length: 13 }, (_, i) => i).map((energy) => {
                    const cardsAtCost = deckCards
                      .filter((item) => (item.card.energy || 0) === energy)
                      .reduce((sum, item) => sum + item.quantity, 0);
                    const maxCards = Math.max(
                      ...Array.from({ length: 13 }, (_, i) =>
                        deckCards
                          .filter((item) => (item.card.energy || 0) === i)
                          .reduce((sum, item) => sum + item.quantity, 0),
                      ),
                    );
                    const height =
                      maxCards > 0 ? (cardsAtCost / maxCards) * 100 * 0.8 : 0;
                    return (
                      <View key={energy} style={styles.energyBar}>
                        <View
                          style={[
                            styles.energyBarFill,
                            {
                              height: `${height}%`,
                              backgroundColor: colors.tint,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.energyBarLabel,
                            { color: colors.icon },
                          ]}
                        >
                          {energy}
                        </Text>
                        <Text
                          style={[
                            styles.energyBarValue,
                            { color: colors.text },
                          ]}
                        >
                          {cardsAtCost}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Energy by Domain */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: cardBackground,
                    borderColor: colors.cardItemBorder,
                  },
                ]}
              >
                <Text style={[styles.statCardTitle, { color: colors.text }]}>
                  Cards by Domain
                </Text>
                {[
                  CardDomain.ORDER,
                  CardDomain.CALM,
                  CardDomain.CHAOS,
                  CardDomain.MIND,
                  CardDomain.BODY,
                ].map((domain) => {
                  const domainCards = deckCards.filter((item) =>
                    item.card.domain?.includes(domain),
                  );
                  const count = domainCards.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );
                  if (count === 0) return null;
                  return (
                    <View
                      key={domain}
                      style={[
                        styles.domainRow,
                        {
                          borderBottomColor: colors.cardItemBorder,
                        },
                      ]}
                    >
                      <Image
                        source={getDomainImage(domain)}
                        style={styles.domainStatIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.domainName, { color: colors.text }]}>
                        {domain}
                      </Text>
                      <Text
                        style={[styles.domainCount, { color: colors.icon }]}
                      >
                        {count} cards
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Set Distribution */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: cardBackground,
                    borderColor: colors.cardItemBorder,
                    marginBottom: 80,
                  },
                ]}
              >
                <Text style={[styles.statCardTitle, { color: colors.text }]}>
                  Set Distribution
                </Text>
                {Object.entries(
                  deckCards.reduce(
                    (acc, item) => {
                      const setName = item.card.set_name || "Unknown";
                      const setAbv = item.card.set_abv || "???";
                      const key = `${setName}|${setAbv}`;
                      if (!acc[key]) acc[key] = 0;
                      acc[key] += item.quantity;
                      return acc;
                    },
                    {} as Record<string, number>,
                  ),
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => {
                    const [setName, setAbv] = key.split("|");
                    const total = deckCards.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <View
                        key={key}
                        style={[
                          styles.setRow,
                          {
                            borderBottomColor: colors.cardItemBorder,
                          },
                        ]}
                      >
                        <View style={styles.setInfo}>
                          <Text
                            style={[styles.setName, { color: colors.text }]}
                          >
                            {setName}
                          </Text>
                          <Text style={[styles.setAbv, { color: colors.icon }]}>
                            {setAbv}
                          </Text>
                        </View>
                        <View style={styles.setStats}>
                          <Text
                            style={[styles.setCount, { color: colors.text }]}
                          >
                            {count} cards
                          </Text>
                          <Text
                            style={[
                              styles.setPercentage,
                              { color: colors.icon },
                            ]}
                          >
                            {percentage}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Floating Menu */}
        {showFabMenu && (
          <View
            style={[
              styles.fabMenu,
              { backgroundColor: colors.headerBackground },
            ]}
          >
            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                setShowImportModal(true);
              }}
            >
              <View style={styles.fabMenuIconContainer}>
                <FontAwesome name="download" size={18} color={colors.tint} />
              </View>
              <Text style={[styles.fabMenuText, { color: colors.text }]}>
                Import Deck
              </Text>
            </Pressable>

            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                showInfo("Add card functionality coming soon");
              }}
            >
              <View style={styles.fabMenuIconContainer}>
                <FontAwesome name="plus" size={18} color={colors.success} />
              </View>
              <Text style={[styles.fabMenuText, { color: colors.text }]}>
                Add Card
              </Text>
            </Pressable>

            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                setShowDeleteModal(true);
              }}
            >
              <View style={styles.fabMenuIconContainer}>
                <FontAwesome name="trash" size={18} color={colors.error} />
              </View>
              <Text style={[styles.fabMenuText, { color: colors.text }]}>
                Delete Deck
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={[styles.fab, { backgroundColor: colors.tint }]}
          onPress={() => setShowFabMenu(!showFabMenu)}
        >
          <FontAwesome
            name={showFabMenu ? "close" : "plus"}
            size={24}
            color="#ffffff"
          />
        </Pressable>
      </SafeAreaView>

      {/* Delete Confirmation Modal */}
      <ModalDialog
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Deck"
        maxHeight="40%"
      >
        <View style={styles.deleteModalContent}>
          <Text style={[styles.deleteWarningText, { color: colors.text }]}>
            Are you sure you want to delete &ldquo;{deck?.name}&rdquo;?
          </Text>
          <Text style={[styles.deleteSubtext, { color: colors.text }]}>
            This action cannot be undone. All cards in this deck will be
            removed.
          </Text>

          <View style={styles.deleteActions}>
            <Button
              variant="outline"
              size="large"
              onPress={() => setShowDeleteModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="large"
              icon="trash"
              onPress={handleDeleteDeck}
              disabled={isDeleting}
              loading={isDeleting}
              style={{ flex: 1 }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </View>
        </View>
      </ModalDialog>

      {/* Import Modal */}
      <ModalDialog
        visible={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportText("");
        }}
        title="Import Cards to Deck"
        maxHeight="90%"
      >
        <View style={styles.importModalContent}>
          <Text style={[styles.importInstructions, { color: colors.text }]}>
            Enter card data in the following format:
          </Text>
          <Text style={[styles.importExample, { color: colors.icon }]}>
            1 Yasuo - Unforgiven (OGN-259){"\n"}1 Ride the Wind (OGN-173){"\n"}1
            Zaun Warrens (OGN-298)
          </Text>
          <TextInput
            style={[
              styles.importTextArea,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                borderColor:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                color: colors.text,
              },
            ]}
            multiline
            numberOfLines={10}
            placeholder={`1 Annie - Dark Child - Starter (OGS-017) \n3 Ride the Wind (OGN-173)\n3 Flash (OGS-011)`}
            placeholderTextColor={colors.icon}
            value={importText}
            onChangeText={setImportText}
            textAlignVertical="top"
          />

          <View style={styles.importActions}>
            <Button
              variant="outline"
              size="large"
              onPress={() => {
                setShowImportModal(false);
                setImportText("");
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="large"
              icon="check"
              onPress={handleImport}
              disabled={!importText.trim() || isImporting}
              loading={isImporting}
              style={{ flex: 1 }}
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </View>
        </View>
      </ModalDialog>

      {/* Card Preview Modal */}
      <CardCollectionPreviewModal
        visible={showCardPreview}
        cards={
          selectedCard
            ? [
                {
                  ...selectedCard.card,
                  quantity: selectedCard.quantity,
                },
              ]
            : []
        }
        initialIndex={0}
        collectionId={deckIdStr}
        isDeck={true}
        onClose={() => setShowCardPreview(false)}
        onEdit={async (updatedCard) => {
          // Optimistically update the selected card with new data
          if (updatedCard && selectedCard) {
            setSelectedCard({
              card: updatedCard,
              quantity: updatedCard.quantity || selectedCard.quantity,
            });
          }
          // Reload deck data after edit
          await loadDeckData();
        }}
        onViewDetails={(card) => {
          router.push({
            pathname: "/card-detail",
            params: {
              cardId: card.id,
            },
          });
        }}
        onRemove={async (card) => {
          try {
            await removeCardFromDeck(deckIdStr, card.id);
            showSuccess(`Removed ${card.name} from deck`);
            // Optimistically update UI
            setDeckCards((prevCards) =>
              prevCards.filter((item) => item.card.id !== card.id),
            );
            setShowCardPreview(false);
          } catch (error) {
            showError("Failed to remove card from deck");
            console.error("Error removing card:", error);
          }
        }}
        onNotification={(message, severity) => {
          if (severity === "success") showSuccess(message);
          else if (severity === "error") showError(message);
          else showInfo(message);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 24,
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
  statsContainer: {
    padding: 20,
    gap: 20,
    paddingTop: 0,
  },
  statCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  statCardSubtext: {
    fontSize: 14,
  },
  energyCurveContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 150,
    gap: 4,
  },
  energyBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  energyBarFill: {
    width: "100%",
    borderRadius: 4,
    minHeight: 2,
  },
  energyBarValue: {
    fontSize: 10,
    fontWeight: "600",
  },
  energyBarLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  domainRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  domainStatIcon: {
    width: 28,
    height: 28,
  },
  domainName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  domainCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  setInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  setAbv: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  setStats: {
    alignItems: "flex-end",
  },
  setCount: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  setPercentage: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 15,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: "500",
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
    letterSpacing: 1,
  },
  sectionStats: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  sectionStatsTextTop: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionStatsTextBottom: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionContent: {
    gap: 8,
  },
  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    gap: 12,
  },
  cardImageContainer: {
    position: "relative",
    width: 50,
    height: 70,
  },
  cardImage: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
  },
  cardPriceBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardPriceText: {
    fontSize: 9,
    fontWeight: "600",
  },
  cardInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardId: {
    fontSize: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  domainIconsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  domainIcon: {
    width: 24,
    height: 24,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabMenu: {
    position: "absolute",
    bottom: 100,
    right: 24,
    borderRadius: 12,
    padding: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    minWidth: 140,
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  fabMenuIconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fabMenuText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteModalContent: {
    gap: 16,
    paddingBottom: 8,
  },
  deleteWarningText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  deleteSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  deleteActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  importModalContent: {
    gap: 16,
  },
  importInstructions: {
    fontSize: 14,
    marginBottom: 4,
  },
  importExample: {
    fontSize: 13,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
    fontFamily: "monospace",
  },
  importTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 200,
    fontFamily: "monospace",
  },
  importActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
});
