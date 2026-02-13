import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomDrawer } from "@/components/bottom-drawer";
import { Button } from "@/components/button";
import { useShowError, useShowSuccess } from "@/contexts/notification-context";
import {
  createDeck,
  getDecksByUser,
  getLegendCardForDeck,
} from "@/db/queries/deck";
import { useAndroidBackHandler } from "@/hooks/use-android-back-handler";
import { useUserId } from "@/hooks/use-user-id";
import { Card } from "@/interfaces/card";
import { Deck } from "@/interfaces/deck";

export default function DecksScreen() {
  useAndroidBackHandler(undefined, true);

  const { userId, loading: userLoading } = useUserId();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckLegends, setDeckLegends] = useState<Record<string, Card | null>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const showSuccess = useShowSuccess();
  const showError = useShowError();

  const loadDecks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const userDecks = (await getDecksByUser(userId)) as Deck[];
      setDecks(userDecks);

      // Load legend cards for each deck
      const legends: Record<string, Card | null> = {};
      for (const deck of userDecks) {
        const legendCard = (await getLegendCardForDeck(deck.id)) as Card | null;
        legends[deck.id] = legendCard;
      }
      setDeckLegends(legends);
    } catch (error) {
      console.error("Error loading decks:", error);
      Alert.alert("Error", "Failed to load decks");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDecks();
    setRefreshing(false);
  }, [loadDecks]);

  const handleCreateDeck = useCallback(() => {
    setShowCreateDrawer(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setShowCreateDrawer(false);
    setNewDeckName("");
    setNewDeckDescription("");
    setCreating(false);
  }, []);

  const handleSubmitDeck = useCallback(async () => {
    if (!userId || !newDeckName.trim()) return;

    try {
      setCreating(true);
      await createDeck({
        user_id: userId,
        name: newDeckName.trim(),
        description: newDeckDescription.trim() || undefined,
      });
      await loadDecks(); // Refresh the list
      handleCloseDrawer();
      showSuccess("Deck created successfully");
    } catch (error) {
      console.error("Error creating deck:", error);
      showError("Failed to create deck");
    } finally {
      setCreating(false);
    }
  }, [
    userId,
    newDeckName,
    newDeckDescription,
    loadDecks,
    handleCloseDrawer,
    showSuccess,
    showError,
  ]);

  useEffect(() => {
    if (userId) {
      loadDecks();
    }
  }, [userId, loadDecks]);

  if (userLoading || loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Decks</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading decks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Decks</Text>
      </View>

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="inbox" size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No Decks Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to create your first deck
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const legendCard = deckLegends[item.id];
          console.log("deck", item);
          return (
            <Pressable
              style={styles.deckCard}
              onPress={() =>
                router.push({
                  pathname: "/deck-detail",
                  params: { deckId: item.id },
                })
              }
            >
              <ImageBackground
                source={
                  legendCard?.image_url
                    ? { uri: legendCard.image_url }
                    : require("@/assets/images/back-image.png")
                }
                style={styles.deckBackground}
                imageStyle={styles.backgroundImage}
              >
                <View style={styles.deckOverlay}>
                  <View style={styles.deckHeader}>
                    <Text style={styles.deckTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </View>

                  <View style={styles.deckStats}>
                    <View style={styles.statBox}>
                      <View style={styles.statIconContainer}>
                        <FontAwesome name="clone" size={14} color="#94a3b8" />
                      </View>
                      <View style={styles.statTextContainer}>
                        <Text style={(styles.statValue, styles.priceValue)}>
                          {/*@ts-ignore */}
                          {item.card_count || 0}
                        </Text>
                        <Text style={styles.statLabel}>Cards</Text>
                      </View>
                    </View>

                    <View style={[styles.statBox, styles.statBoxLast]}>
                      <View style={styles.statIconContainer}>
                        <FontAwesome name="euro" size={14} color="#94a3b8" />
                      </View>
                      <View style={styles.statTextContainer}>
                        <Text style={[styles.statValue, styles.priceValue]}>
                          {/*@ts-ignore */}
                          {(item.total_value || 0).toFixed(2)} €
                        </Text>
                        <Text style={styles.statLabel}>Value</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          );
        }}
      />

      <BottomDrawer
        visible={showCreateDrawer}
        onClose={handleCloseDrawer}
        title="Create New Deck"
        stickyFooter={
          <View style={styles.drawerFooter}>
            <Button
              variant="outline"
              size="large"
              onPress={handleCloseDrawer}
              style={styles.footerButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="large"
              icon="check"
              onPress={handleSubmitDeck}
              disabled={!newDeckName.trim() || creating}
              loading={creating}
              style={styles.footerButton}
            >
              {creating ? "Creating..." : "Create Deck"}
            </Button>
          </View>
        }
      >
        <View style={styles.drawerContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Deck Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder="Enter deck name"
              placeholderTextColor="#64748b"
              maxLength={50}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newDeckDescription}
              onChangeText={setNewDeckDescription}
              placeholder="Add a description for your deck"
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
        </View>
      </BottomDrawer>

      {/* Floating Action Button */}
      <Pressable style={styles.fab} onPress={handleCreateDeck}>
        <FontAwesome name="plus" size={24} color={"white"} />
      </Pressable>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContainer: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deckCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: "48%",
  },
  deckBackground: {
    width: "100%",
    height: 180,
  },
  backgroundImage: {
    borderRadius: 16,
    opacity: 0.3,
  },
  deckOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  deckHeader: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  deckSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  deckStats: {
    flexDirection: "column",
    gap: 8,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
  statBoxLast: {
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  priceValue: {
    color: "#22c55e",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  drawerContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#f1f5f9",
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  drawerFooter: {
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
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
});
