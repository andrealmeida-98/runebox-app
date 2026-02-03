import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomDrawer } from "@/components/bottom-drawer";
import { Button } from "@/components/button";
import { CardCollectionPreviewModal } from "@/components/card-collection-preview-modal";
import { CardGridItem } from "@/components/card-grid-item";
import { ModalDialog } from "@/components/modal";
import { SearchInput } from "@/components/search-input";
import { TextInput as CustomTextInput } from "@/components/text-input";
import {
  useShowError,
  useShowInfo,
  useShowSuccess,
  useShowWarning,
} from "@/contexts/notification-context";
import { useTheme } from "@/contexts/theme-context";
import { db } from "@/db/database";
import {
  deleteCollection,
  getCollectionEntries,
  updateCollection,
} from "@/db/queries/collection";
import { Card, CardRarity, CardType } from "@/interfaces/card";
import {
  importCardsToCollection,
  parseCardImportText,
} from "@/utils/import-cards";
import { getThemeColors } from "@/utils/theme-utils";

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
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [selectedCardTypes, setSelectedCardTypes] = useState<string[]>([]);

  const showSuccess = useShowSuccess();
  const showError = useShowError();
  const showWarning = useShowWarning();
  const showInfo = useShowInfo();
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState("price-high-low");
  const [cards, setCards] = useState<Card[]>([]);
  const [collectionEntries, setCollectionEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState(collectionName);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load collection data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCollectionData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collectionId]),
  );

  const loadCollectionData = useCallback(async () => {
    setLoading(true);
    try {
      // Get collection entries
      const entries = await getCollectionEntries(collectionId);
      setCollectionEntries(entries);

      // Get cards for this collection with quantity
      if (entries.length > 0) {
        const cardIds = entries.map((entry: any) => entry.card_id);
        const placeholders = cardIds.map(() => "?").join(",");
        const cardsData = await db.getAllAsync(
          `SELECT * FROM cards WHERE id IN (${placeholders})`,
          cardIds,
        );
        setCards(cardsData as Card[]);
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error("Error loading collection data:", error);
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  // Merge cards with collection data
  type CardWithCollection = Card & {
    quantity: number;
    collectionId: string;
  };
  const cardsWithCollection: CardWithCollection[] = cards
    .map((card) => {
      const collection = collectionEntries.find(
        (c: any) => c.card_id === card.id,
      );
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
          const price = b.price || b.price_foil || 0;
          const priceA = a.price || a.price_foil || 0;
          return price - priceA;
        case "price-low-high":
          const priceLow = a.price || a.price_foil || 0;
          const priceLowB = b.price || b.price_foil || 0;
          return priceLow - priceLowB;
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
        : [...prev, lowerType],
    );
  };

  const toggleRarity = (rarity: string) => {
    setSelectedRarities((prev) =>
      prev.includes(rarity)
        ? prev.filter((r) => r !== rarity)
        : [...prev, rarity],
    );
  };

  const handleImport = async () => {
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

      const result = await importCardsToCollection(collectionId, parsedCards);

      if (result.errors.length > 0) {
        showWarning(
          `Success: ${result.totalQuantity} card(s), Failed: ${result.failed}. Check console for errors.`,
        );
        console.log("Import errors:", result.errors.slice(0, 10).join("\n"));
      } else {
        showSuccess(`Imported ${result.totalQuantity} card(s) successfully`);
      }

      setImportText("");
      setShowImportModal(false);
      await loadCollectionData();
    } catch (error) {
      showError(`Failed to import cards: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteCollection = async () => {
    setIsDeleting(true);
    try {
      await deleteCollection(collectionId);
      showSuccess("Collection deleted successfully");
      setShowDeleteModal(false);
      // Navigate back after a short delay
      setTimeout(() => {
        router.push("/collection");
      }, 500);
    } catch (error) {
      showError(`Failed to delete collection: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateCollectionName = async () => {
    if (!newCollectionName.trim()) {
      showError("Please enter a collection name");
      return;
    }

    setIsUpdating(true);
    try {
      await updateCollection(collectionId, { name: newCollectionName });
      showSuccess("Collection name updated successfully");
      setShowEditNameModal(false);
      // Refresh the page with the new name
      router.setParams({ name: newCollectionName });
    } catch (error) {
      showError(`Failed to update collection name: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };
  const theme = useTheme();
  const { cardBackground } = getThemeColors(theme.theme);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: collectionName,
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: cardBackground,
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.push("/collection")}
              style={{ padding: 8, marginLeft: 8 }}
            >
              <FontAwesome name="arrow-left" size={20} color="#ffffff" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => setShowMenuDrawer(true)}
              style={{ padding: 8, marginRight: 8 }}
            >
              <FontAwesome name="ellipsis-v" size={20} color="#ffffff" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        {/* Search Bar */}
        <SearchInput
          style={styles.searchInput}
          placeholder="Search cards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter and Sort Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowFilter(true)}
          >
            <FontAwesome name="filter" size={20} color="#22c55e" />
            <Text style={styles.actionButtonText}>FILTER</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowSort(true)}
          >
            <FontAwesome name="sort" size={20} color="#22c55e" />
            <Text style={styles.actionButtonText}>SORT</Text>
          </TouchableOpacity>
        </View>

        {/* Cards Grid */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066cc" />
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {filteredCards.map((card, index) => (
                <CardGridItem
                  key={card.id}
                  card={card}
                  quantity={card.quantity}
                  cardWidth={CARD_WIDTH}
                  cardHeight={CARD_HEIGHT}
                  onPress={() => {
                    setSelectedCardIndex(index);
                    setShowCardPreview(true);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Menu */}
        {showFabMenu && (
          <View style={styles.fabMenu}>
            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                setShowImportModal(true);
              }}
            >
              <View style={styles.fabMenuIconContainer}>
                <FontAwesome name="download" size={20} color="#ffffff" />
              </View>
              <Text style={styles.fabMenuText}>Import</Text>
            </Pressable>

            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                // Handle export
                console.log("Export");
              }}
            >
              <View style={styles.fabMenuIconContainer}>
                <FontAwesome name="upload" size={20} color="#ffffff" />
              </View>
              <Text style={styles.fabMenuText}>Export</Text>
            </Pressable>

            <Pressable
              style={styles.fabMenuItem}
              onPress={() => {
                setShowFabMenu(false);
                router.push({
                  pathname: "/add-card-to-collection",
                  params: {
                    collectionId,
                    collectionName,
                  },
                });
              }}
            >
              <View style={styles.fabMenuIconContainer}>
                <FontAwesome name="search" size={20} color="#ffffff" />
              </View>
              <Text style={styles.fabMenuText}>Search</Text>
            </Pressable>
          </View>
        )}

        {/* Floating Action Button */}
        <Pressable
          style={styles.fab}
          onPress={() => setShowFabMenu(!showFabMenu)}
        >
          <FontAwesome name="plus" size={24} color="#ffffff" />
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

      {/* Import Modal */}
      <ModalDialog
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Cards"
        maxHeight="90%"
      >
        <View style={styles.importModalContent}>
          <Text style={styles.importInstructions}>
            Enter card data in the following format:
          </Text>
          <TextInput
            style={styles.importTextArea}
            multiline
            numberOfLines={10}
            placeholder={`1 Annie - Dark Child - Starter (OGS-017) \n3 Ride the Wind (OGN-173)\n3 Flash (OGS-011)`}
            placeholderTextColor="#64748b"
            value={importText}
            onChangeText={setImportText}
            textAlignVertical="top"
          />

          <View style={styles.importActions}>
            <Button
              variant="secondary"
              icon="file-text"
              onPress={() => {
                // TODO: Implement CSV import
                showInfo("CSV import will be available soon");
              }}
              fullWidth
            >
              Import from CSV
            </Button>

            <Button
              variant="primary"
              icon="check"
              onPress={handleImport}
              disabled={isImporting}
              loading={isImporting}
              fullWidth
            >
              {isImporting ? "Importing..." : "Import Cards"}
            </Button>
          </View>
        </View>
      </ModalDialog>

      {/* Menu Drawer */}
      <BottomDrawer
        visible={showMenuDrawer}
        onClose={() => setShowMenuDrawer(false)}
        title="Collection Options"
        maxHeight="40%"
      >
        <View style={styles.menuDrawerContent}>
          <Pressable
            style={styles.menuOption}
            onPress={() => {
              setShowMenuDrawer(false);
              setShowEditNameModal(true);
            }}
          >
            <FontAwesome name="edit" size={20} color="#3b82f6" />
            <Text style={styles.menuOptionText}>Edit Name</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuOption}
            onPress={() => {
              setShowMenuDrawer(false);
              setShowDeleteModal(true);
            }}
          >
            <FontAwesome name="trash" size={20} color="#ef4444" />
            <Text style={[styles.menuOptionText, { color: "#ef4444" }]}>
              Delete Collection
            </Text>
          </Pressable>
        </View>
      </BottomDrawer>

      {/* Delete Confirmation Modal */}
      <ModalDialog
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Collection"
        maxHeight="40%"
      >
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteWarningText}>
            Are you sure you want to delete &ldquo;{collectionName}&rdquo;?
          </Text>
          <Text style={styles.deleteSubtext}>
            This action cannot be undone. All cards in this collection will be
            removed.
          </Text>

          <View style={styles.deleteActions}>
            <Button
              variant="secondary"
              onPress={() => setShowDeleteModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={handleDeleteCollection}
              disabled={isDeleting}
              loading={isDeleting}
              style={{ flex: 1 }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </View>
        </View>
      </ModalDialog>

      {/* Edit Name Modal */}
      <ModalDialog
        visible={showEditNameModal}
        onClose={() => setShowEditNameModal(false)}
        title="Edit Collection Name"
        maxHeight="40%"
      >
        <View style={styles.editNameModalContent}>
          <Text style={styles.editNameLabel}>Collection Name</Text>
          <CustomTextInput
            icon="folder"
            value={newCollectionName}
            onChangeText={setNewCollectionName}
            placeholder="Enter collection name"
            autoFocus
          />

          <View style={styles.editNameActions}>
            <Button
              variant="secondary"
              onPress={() => {
                setShowEditNameModal(false);
                setNewCollectionName(collectionName);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleUpdateCollectionName}
              disabled={isUpdating}
              loading={isUpdating}
              style={{ flex: 1 }}
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </View>
        </View>
      </ModalDialog>

      {/* Card Preview Modal */}
      <CardCollectionPreviewModal
        visible={showCardPreview}
        cards={filteredCards}
        initialIndex={selectedCardIndex}
        collectionId={collectionId}
        onClose={() => setShowCardPreview(false)}
        onEdit={async (card) => {
          // Reload collection data after edit
          await loadCollectionData();
        }}
        onViewDetails={(card) => {
          router.push({
            pathname: "/card-detail",
            params: {
              cardId: card.id,
              collectionId,
              cardIds: card.id,
            },
          });
        }}
        onAddToCollection={(card) => {
          // TODO: Implement add to collection functionality
          showInfo("Add to collection functionality coming soon");
        }}
        onRemove={(card) => {
          // TODO: Implement remove from collection functionality
          showInfo("Remove from collection functionality coming soon");
        }}
        onNotification={(message, severity) => {
          if (severity === "success") showSuccess(message);
          else if (severity === "error") showError(message);
          else showInfo(message);
        }}
        onIndexChange={(index) => {
          // Calculate the row of the card in the grid (3 cards per row)
          const row = Math.floor(index / 3);
          // Calculate Y position: row * (card height + gap)
          const yPosition = row * (CARD_HEIGHT + CARD_GAP);
          // Scroll to the calculated position
          scrollViewRef.current?.scrollTo({
            y: yPosition,
            animated: true,
          });
        }}
      />
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
  scrollContent: {
    paddingBottom: 24,
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
    marginBottom: 16,
  },
  actionButton: {
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
  actionButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: CARD_PADDING,
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
    width: 56,
    height: 56,
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
  fabMenu: {
    position: "absolute",
    bottom: 100,
    right: 24,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 160,
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
    color: "#ffffff",
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
  importModalContent: {
    gap: 16,
  },
  importInstructions: {
    fontSize: 14,
    color: "#cbd5e1",
    marginBottom: 4,
  },
  importExample: {
    fontSize: 13,
    color: "#64748b",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  importTextArea: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: "#ffffff",
    minHeight: 200,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  importActions: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  importButtonPrimary: {
    backgroundColor: "#22c55e",
  },
  importButtonSecondary: {
    backgroundColor: "#3b82f6",
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  menuDrawerContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 18,
  },
  menuOptionText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#ffffff",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 4,
  },
  deleteModalContent: {
    gap: 16,
    paddingBottom: 8,
  },
  deleteWarningText: {
    fontSize: 17,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
  },
  deleteSubtext: {
    fontSize: 14,
    color: "#cbd5e1",
    textAlign: "center",
    lineHeight: 20,
  },
  deleteActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editNameModalContent: {
    gap: 16,
    paddingBottom: 8,
  },
  editNameLabel: {
    fontSize: 15,
    color: "#cbd5e1",
    fontWeight: "500",
    marginBottom: 4,
  },
  editNameActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
});
