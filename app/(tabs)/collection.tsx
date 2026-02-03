import { BottomDrawer } from "@/components/bottom-drawer";
import { Button } from "@/components/button";
import { useTheme } from "@/contexts/theme-context";
import {
  createCollection,
  getAllCollectionsWithStats,
} from "@/db/queries/collection";
import { useUserId } from "@/hooks/use-user-id";
import {
  CardCollection,
  CollectionColor,
  CollectionIcon,
} from "@/interfaces/card";
import { getThemeColors } from "@/utils/theme-utils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CollectionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { userId } = useUserId();
  const [searchQuery, setSearchQuery] = useState("");
  const [collections, setCollections] = useState<CardCollection[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<CollectionIcon>(
    CollectionIcon.STAR,
  );
  const [selectedColor, setSelectedColor] = useState<CollectionColor>(
    CollectionColor.BLUE,
  );
  const [showSort, setShowSort] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>("name-asc");

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      await createCollection({
        user_id: userId || "unknown",
        name: newCollectionName.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });

      // Reload collections
      await loadCollections();

      setIsDrawerOpen(false);
      setNewCollectionName("");
      setSelectedIcon(CollectionIcon.STAR);
      setSelectedColor(CollectionColor.BLUE);
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  const loadCollections = useCallback(async () => {
    try {
      const collectionsWithStats = await getAllCollectionsWithStats();
      setCollections(collectionsWithStats);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }, []);

  const totalValue = collections.reduce(
    (sum, collection) => sum + collection.totalValue,
    0,
  );

  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [loadCollections]),
  );

  const filteredCollections = collections
    .filter((collection) =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      switch (selectedSort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price":
          return b.totalValue - a.totalValue;
        case "cards":
          return b.cardCount - a.cardCount;
        default:
          return 0;
      }
    });

  const {
    backgroundColor,
    cardBackground,
    inputBackground,
    textColor,
    secondaryTextColor,
    borderColor,
  } = getThemeColors(theme);
  const isDark = theme === "dark";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          My Collections
        </Text>
      </View>

      {/* Total Value Section */}
      <View
        style={[styles.totalValueSection, { backgroundColor: cardBackground }]}
      >
        <Text style={[styles.totalValueLabel, { color: secondaryTextColor }]}>
          TOTAL VALUE
        </Text>
        <Text style={[styles.totalValueAmount, { color: textColor }]}>
          ${totalValue.toFixed(2)}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          {collections.map((collection) => {
            const percentage = (collection.totalValue / totalValue) * 100;
            return (
              <View
                key={collection.id}
                style={[
                  styles.progressSegment,
                  {
                    flex: percentage,
                    backgroundColor: collection.color,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {collections.map((collection) => (
            <View key={collection.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: collection.color },
                ]}
              />
              <Text style={[styles.legendText, { color: secondaryTextColor }]}>
                {collection.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Search Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: cardBackground }]}
      >
        <FontAwesome
          name="search"
          size={16}
          color={secondaryTextColor}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search collections..."
          placeholderTextColor={secondaryTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sort and Add Buttons */}
      <View style={styles.actionsRow}>
        <Button
          variant="outline"
          size="medium"
          icon="sort-amount-desc"
          onPress={() => setShowSort(true)}
          style={styles.sortButton as any}
        >
          {selectedSort === "name-asc"
            ? "Name (A-Z)"
            : selectedSort === "name-desc"
              ? "Name (Z-A)"
              : selectedSort === "price"
                ? "Price"
                : "Cards"}
        </Button>
        <Button
          variant="primary"
          size="small"
          icon="plus"
          onPress={() => setIsDrawerOpen(true)}
          style={styles.addButton}
        />
      </View>

      {/* Collections Count */}
      <Text style={[styles.collectionsCount, { color: secondaryTextColor }]}>
        Showing {filteredCollections.length} collections
      </Text>

      {/* Collections List - Scrollable */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.collectionsList}>
          {filteredCollections.map((collection) => (
            <Pressable
              key={collection.id}
              style={[
                styles.collectionCard,
                {
                  borderLeftColor: collection.color,
                  backgroundColor: cardBackground,
                },
              ]}
              onPress={() =>
                router.push(
                  `/collection-detail?id=${
                    collection.id
                  }&name=${encodeURIComponent(collection.name)}`,
                )
              }
            >
              <View
                style={[
                  styles.collectionIcon,
                  { backgroundColor: inputBackground },
                ]}
              >
                <FontAwesome
                  name={collection.icon as any}
                  size={24}
                  color={collection.color}
                />
              </View>
              <View style={styles.collectionInfo}>
                <Text style={[styles.collectionName, { color: textColor }]}>
                  {collection.name}
                </Text>
                <Text
                  style={[
                    styles.collectionCards,
                    { color: secondaryTextColor },
                  ]}
                >
                  {collection.cardCount.toLocaleString()} cards
                </Text>
              </View>
              <View style={styles.collectionRight}>
                <Text style={[styles.collectionValue, { color: textColor }]}>
                  ${collection.totalValue.toLocaleString()}
                </Text>
                <FontAwesome
                  name="chevron-right"
                  size={16}
                  color={secondaryTextColor}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Add Collection Drawer */}
      <BottomDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Add New Collection"
        maxHeight={"100%"}
      >
        <View style={styles.drawerContent}>
          {/* Collection Name Input */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: textColor }]}>
              Collection Name
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: inputBackground,
                  color: textColor,
                  borderColor,
                },
              ]}
              placeholder="e.g. Vintage Holos"
              placeholderTextColor={secondaryTextColor}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: textColor }]}>
              Select Icon
            </Text>
            <View style={styles.iconGrid}>
              {Object.values(CollectionIcon).map((icon) => (
                <Pressable
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionSelected,
                    styles.collectionIcon2,
                    {
                      backgroundColor: inputBackground,
                      borderColor:
                        selectedIcon === icon
                          ? (selectedColor ?? "#22c55e")
                          : borderColor,
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <FontAwesome
                    name={icon as any}
                    size={24}
                    color={
                      selectedIcon === icon
                        ? (selectedColor ?? textColor)
                        : secondaryTextColor
                    }
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: textColor }]}>
              Collection Color
            </Text>
            <View style={styles.colorGrid}>
              {Object.values(CollectionColor).map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              variant="outline"
              size="large"
              onPress={() => setIsDrawerOpen(false)}
              style={styles.cancelButton as any}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="large"
              onPress={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              style={styles.createButton}
            >
              Create
            </Button>
          </View>
        </View>
      </BottomDrawer>

      {/* Sort Drawer */}
      <BottomDrawer
        visible={showSort}
        onClose={() => setShowSort(false)}
        title="Sort Collections By"
        maxHeight="70%"
      >
        <View style={styles.sortDrawerContent}>
          {/* Name A-Z */}
          <Pressable
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort("name-asc");
            }}
          >
            <View style={styles.sortOptionLeft}>
              <View
                style={[
                  styles.sortIconContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(100, 116, 139, 0.2)"
                      : "rgba(100, 116, 139, 0.15)",
                  },
                ]}
              >
                <Text
                  style={[styles.sortIconText, { color: secondaryTextColor }]}
                >
                  AZ
                </Text>
              </View>
              <Text style={[styles.sortOptionText, { color: textColor }]}>
                Alphabetic (A-Z)
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                { borderColor },
                selectedSort === "name-asc" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "name-asc" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>

          {/* Name Z-A */}
          <Pressable
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort("name-desc");
            }}
          >
            <View style={styles.sortOptionLeft}>
              <View
                style={[
                  styles.sortIconContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(100, 116, 139, 0.2)"
                      : "rgba(100, 116, 139, 0.15)",
                  },
                ]}
              >
                <Text
                  style={[styles.sortIconText, { color: secondaryTextColor }]}
                >
                  ZA
                </Text>
              </View>
              <Text style={[styles.sortOptionText, { color: textColor }]}>
                Alphabetic (Z-A)
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                { borderColor },
                selectedSort === "name-desc" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "name-desc" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>

          {/* Price */}
          <Pressable
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort("price");
            }}
          >
            <View style={styles.sortOptionLeft}>
              <View
                style={[
                  styles.sortIconContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(100, 116, 139, 0.2)"
                      : "rgba(100, 116, 139, 0.15)",
                  },
                ]}
              >
                <FontAwesome
                  name="dollar"
                  size={16}
                  color={secondaryTextColor}
                />
              </View>
              <Text style={[styles.sortOptionText, { color: textColor }]}>
                Price
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                { borderColor },
                selectedSort === "price" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "price" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>

          {/* Cards */}
          <Pressable
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort("cards");
            }}
          >
            <View style={styles.sortOptionLeft}>
              <View
                style={[
                  styles.sortIconContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(100, 116, 139, 0.2)"
                      : "rgba(100, 116, 139, 0.15)",
                  },
                ]}
              >
                <FontAwesome
                  name="clone"
                  size={14}
                  color={secondaryTextColor}
                />
              </View>
              <Text style={[styles.sortOptionText, { color: textColor }]}>
                Cards
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                { borderColor },
                selectedSort === "cards" && styles.radioButtonSelected,
              ]}
            >
              {selectedSort === "cards" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </Pressable>
        </View>
      </BottomDrawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  totalValueSection: {
    padding: 20,
    borderRadius: 16,
  },
  totalValueLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalValueAmount: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 16,
  },
  progressBarContainer: {
    flexDirection: "row",
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressSegment: {
    height: "100%",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  collectionsCount: {
    fontSize: 13,
    marginVertical: 12,
  },
  collectionsList: {
    paddingBottom: 20,
    gap: 12,
  },
  collectionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  collectionIcon2: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  collectionCards: {
    fontSize: 13,
  },
  collectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collectionValue: {
    fontSize: 16,
    fontWeight: "bold",
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
    borderBottomColor: "rgba(100, 116, 139, 0.1)",
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
    alignItems: "center",
    justifyContent: "center",
  },
  sortIconContainerGreen: {
    backgroundColor: "#22c55e",
  },
  sortIconText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sortOptionText: {
    fontSize: 17,
    fontWeight: "500",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
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
  // Drawer Styles
  drawerContent: {
    padding: 20,
    paddingTop: 12,
    gap: 16,
  },
  formSection: {
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  iconGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  iconOptionSelected: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  colorGrid: {
    flexDirection: "row",
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#ffffff",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#334155",
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
