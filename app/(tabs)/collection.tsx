import { BottomDrawer } from "@/components/bottom-drawer";
import { createCollection, getAllCollections } from "@/db/queries/collection";
import { useUserId } from "@/hooks/use-user-id";
import {
  CardCollection,
  CollectionColor,
  CollectionIcon,
} from "@/interfaces/card";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  const router = useRouter();
  const { userId } = useUserId();
  const [searchQuery, setSearchQuery] = useState("");
  const [collections, setCollections] = useState<CardCollection[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<CollectionIcon>(
    CollectionIcon.STAR
  );
  const [selectedColor, setSelectedColor] = useState<CollectionColor>(
    CollectionColor.BLUE
  );
  const [showSort, setShowSort] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>("name-asc");

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection: CardCollection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      user_id: userId || "unknown",
      cardCount: 0,
      totalValue: 0,
    };

    createCollection({
      user_id: newCollection.user_id,
      name: newCollection.name,
      color: newCollection.color,
      icon: newCollection.icon,
    }).catch(console.error);

    setCollections([...collections, newCollection]);
    setIsDrawerOpen(false);
    setNewCollectionName("");
    setSelectedIcon(CollectionIcon.STAR);
    setSelectedColor(CollectionColor.BLUE);
  };

  const totalValue = collections.reduce(
    (sum, collection) => sum + collection.totalValue,
    0
  );

  const filteredCollections = collections
    .filter((collection) =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  useEffect(() => {
    getAllCollections()
      .then((data) => {
        setCollections(data);
      })
      .catch(console.error);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Collections</Text>
      </View>

      {/* Total Value Section */}
      <View style={styles.totalValueSection}>
        <Text style={styles.totalValueLabel}>TOTAL VALUE</Text>
        <Text style={styles.totalValueAmount}>${totalValue}</Text>

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
              <Text style={styles.legendText}>{collection.name}</Text>
            </View>
          ))}
        </View>
      </View>

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
          placeholder="Search collections..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sort and Add Buttons */}
      <View style={styles.actionsRow}>
        <Pressable style={styles.sortButton} onPress={() => setShowSort(true)}>
          <FontAwesome name="sort-amount-desc" size={14} color="#ffffff" />
          <Text style={styles.sortButtonText}>
            {selectedSort === "name-asc"
              ? "Name (A-Z)"
              : selectedSort === "name-desc"
              ? "Name (Z-A)"
              : selectedSort === "price"
              ? "Price"
              : "Cards"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.addButton}
          onPress={() => setIsDrawerOpen(true)}
        >
          <FontAwesome name="plus" size={20} color="#ffffff" />
        </Pressable>
      </View>

      {/* Collections Count */}
      <Text style={styles.collectionsCount}>
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
                { borderLeftColor: collection.color },
              ]}
              onPress={() =>
                router.push(
                  `/collection-detail?id=${
                    collection.id
                  }&name=${encodeURIComponent(collection.name)}`
                )
              }
            >
              <View style={styles.collectionIcon}>
                <FontAwesome
                  name={collection.icon as any}
                  size={24}
                  color={collection.color}
                />
              </View>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName}>{collection.name}</Text>
                <Text style={styles.collectionCards}>
                  {collection.cardCount.toLocaleString()} cards
                </Text>
              </View>
              <View style={styles.collectionRight}>
                <Text style={styles.collectionValue}>
                  ${collection.totalValue.toLocaleString()}
                </Text>
                <FontAwesome name="chevron-right" size={16} color="#64748b" />
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
            <Text style={styles.formLabel}>Collection Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Vintage Holos"
              placeholderTextColor="#64748b"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Select Icon</Text>
            <View style={styles.iconGrid}>
              {Object.values(CollectionIcon).map((icon) => (
                <Pressable
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionSelected,
                    styles.collectionIcon2,
                    {
                      borderColor:
                        selectedIcon === icon
                          ? selectedColor ?? "#22c55e"
                          : "#334155",
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <FontAwesome
                    name={icon as any}
                    size={24}
                    color={
                      selectedIcon === icon
                        ? selectedColor ?? "#ffffff"
                        : "#64748b"
                    }
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Collection Color</Text>
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
            <Pressable
              style={styles.cancelButton}
              onPress={() => setIsDrawerOpen(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.createButton,
                !newCollectionName.trim() && styles.createButtonDisabled,
              ]}
              onPress={handleCreateCollection}
              disabled={!newCollectionName.trim()}
            >
              <Text style={styles.createButtonText}>Create Collection</Text>
            </Pressable>
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
              <View style={styles.sortIconContainer}>
                <Text style={styles.sortIconText}>AZ</Text>
              </View>
              <Text style={styles.sortOptionText}>Alphabetic (A-Z)</Text>
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

          {/* Name Z-A */}
          <Pressable
            style={styles.sortOption}
            onPress={() => {
              setSelectedSort("name-desc");
            }}
          >
            <View style={styles.sortOptionLeft}>
              <View style={styles.sortIconContainer}>
                <Text style={styles.sortIconText}>ZA</Text>
              </View>
              <Text style={styles.sortOptionText}>Alphabetic (Z-A)</Text>
            </View>
            <View
              style={[
                styles.radioButton,
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
              <View style={styles.sortIconContainer}>
                <FontAwesome name="dollar" size={16} color="#64748b" />
              </View>
              <Text style={styles.sortOptionText}>Price</Text>
            </View>
            <View
              style={[
                styles.radioButton,
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
              <View style={styles.sortIconContainer}>
                <FontAwesome name="clone" size={14} color="#64748b" />
              </View>
              <Text style={styles.sortOptionText}>Cards</Text>
            </View>
            <View
              style={[
                styles.radioButton,
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
    backgroundColor: "#0f172a",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1e293b",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  totalValueSection: {
    padding: 20,
    backgroundColor: "#1e293b",
  },
  totalValueLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalValueAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
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
    color: "#cbd5e1",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginHorizontal: 16,
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
    color: "#ffffff",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 20,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
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
    color: "#64748b",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  collectionsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  collectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  collectionIcon2: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0f172a",
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
    color: "#ffffff",
    marginBottom: 4,
  },
  collectionCards: {
    fontSize: 13,
    color: "#94a3b8",
  },
  collectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collectionValue: {
    fontSize: 16,
    fontWeight: "bold",
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
    color: "#f1f5f9",
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#334155",
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
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#334155",
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
    backgroundColor: "#334155",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
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
