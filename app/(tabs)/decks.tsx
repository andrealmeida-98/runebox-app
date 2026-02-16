import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useFocusEffect } from "expo-router";
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
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomDrawer } from "@/components/bottom-drawer";
import { Button } from "@/components/button";
import { ModalDialog } from "@/components/modal";
import { useCurrency } from "@/contexts/currency-context";
import { useShowError, useShowSuccess } from "@/contexts/notification-context";
import { db } from "@/db/database";
import {
  createDeck,
  deleteDeck,
  getDecksByUser,
  getLegendCardForDeck,
  updateDeck,
} from "@/db/queries/deck";
import { useAndroidBackHandler } from "@/hooks/use-android-back-handler";
import { useUserId } from "@/hooks/use-user-id";
import { Card } from "@/interfaces/card";
import { Deck } from "@/interfaces/deck";
import { formatPrice } from "@/utils/currency-utils";

export default function DecksScreen() {
  useAndroidBackHandler(undefined, true);

  const { userId, loading: userLoading } = useUserId();
  const { currency } = useCurrency();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckLegends, setDeckLegends] = useState<Record<string, Card | null>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Deck options drawer
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [renameDeckName, setRenameDeckName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Deck options handlers
  const handleLongPressDeck = useCallback((deck: Deck) => {
    Vibration.vibrate(50);
    setSelectedDeck(deck);
    setShowOptionsDrawer(true);
  }, []);

  const handleCloseOptionsDrawer = useCallback(() => {
    setShowOptionsDrawer(false);
    setShowRenameInput(false);
    setRenameDeckName("");
    setRenaming(false);
    setTimeout(() => setSelectedDeck(null), 300);
  }, []);

  const handleRenameOption = useCallback(() => {
    if (selectedDeck) {
      setRenameDeckName(selectedDeck.name);
      setShowRenameInput(true);
    }
  }, [selectedDeck]);

  const handleSubmitRename = useCallback(async () => {
    if (!selectedDeck || !renameDeckName.trim()) return;

    try {
      setRenaming(true);
      await updateDeck(selectedDeck.id, {
        name: renameDeckName.trim(),
      });
      await loadDecks();
      handleCloseOptionsDrawer();
      showSuccess("Deck renamed successfully");
    } catch (error) {
      console.error("Error renaming deck:", error);
      showError("Failed to rename deck");
    } finally {
      setRenaming(false);
    }
  }, [
    selectedDeck,
    renameDeckName,
    loadDecks,
    handleCloseOptionsDrawer,
    showSuccess,
    showError,
  ]);

  const handleDuplicateDeck = useCallback(async () => {
    if (!selectedDeck || !userId) return;

    try {
      // Create a new deck with the same name + " (Copy)"
      const newDeckId = await createDeck({
        user_id: userId,
        name: `${selectedDeck.name} (Copy)`,
        description: selectedDeck.description || undefined,
      });

      // Copy all deck entries
      await db.runAsync(
        `
        INSERT INTO deck_entries (id, deck_id, card_id, quantity)
        SELECT randomblob(16), ?, card_id, quantity
        FROM deck_entries
        WHERE deck_id = ?
        `,
        [newDeckId, selectedDeck.id]
      );

      // Update the card count for the new deck
      const { updateDeckCardCount } = await import("@/db/queries/deck");
      await updateDeckCardCount(newDeckId);

      await loadDecks();
      handleCloseOptionsDrawer();
      showSuccess("Deck duplicated successfully");
    } catch (error) {
      console.error("Error duplicating deck:", error);
      showError("Failed to duplicate deck");
    }
  }, [
    selectedDeck,
    userId,
    loadDecks,
    handleCloseOptionsDrawer,
    showSuccess,
    showError,
  ]);

  const handleDeleteDeck = useCallback(() => {
    if (!selectedDeck) return;
    setShowDeleteModal(true);
  }, [selectedDeck]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedDeck) return;

    try {
      setDeleting(true);
      await deleteDeck(selectedDeck.id);
      await loadDecks();
      setShowDeleteModal(false);
      handleCloseOptionsDrawer();
      showSuccess("Deck deleted successfully");
    } catch (error) {
      console.error("Error deleting deck:", error);
      showError("Failed to delete deck");
    } finally {
      setDeleting(false);
    }
  }, [
    selectedDeck,
    loadDecks,
    handleCloseOptionsDrawer,
    showSuccess,
    showError,
  ]);

  useEffect(() => {
    if (userId) {
      loadDecks();
    }
  }, [userId, loadDecks]);

  // Reload decks when screen comes into focus (e.g., when navigating back from deck-detail)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadDecks();
      }
    }, [userId, loadDecks])
  );

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
          return (
            <Pressable
              style={styles.deckCard}
              onPress={() =>
                router.push({
                  pathname: "/deck-detail",
                  params: { deckId: item.id },
                })
              }
              onLongPress={() => handleLongPressDeck(item)}
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
                          {formatPrice(item.total_value || 0, currency)}
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

      {/* Deck Options Drawer */}
      <BottomDrawer
        visible={showOptionsDrawer}
        onClose={handleCloseOptionsDrawer}
        title={showRenameInput ? "Rename Deck" : "Deck Options"}
        minHeight={showRenameInput ? "35%" : "45%"}
        stickyFooter={
          showRenameInput ? (
            <View style={styles.drawerFooter}>
              <Button
                variant="outline"
                size="large"
                onPress={() => setShowRenameInput(false)}
                style={styles.footerButton}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="large"
                icon="check"
                onPress={handleSubmitRename}
                disabled={!renameDeckName.trim() || renaming}
                loading={renaming}
                style={styles.footerButton}
              >
                {renaming ? "Saving..." : "Save"}
              </Button>
            </View>
          ) : undefined
        }
      >
        {showRenameInput ? (
          <View style={styles.drawerContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deck Name *</Text>
              <TextInput
                style={styles.textInput}
                value={renameDeckName}
                onChangeText={setRenameDeckName}
                placeholder="Enter deck name"
                placeholderTextColor="#64748b"
                maxLength={50}
                autoFocus
              />
            </View>
          </View>
        ) : (
          <View style={styles.optionsWrapper}>
            <View style={styles.optionsContainer}>
              <Pressable
                style={styles.optionButton}
                onPress={handleRenameOption}
              >
                <View style={styles.optionIconContainer}>
                  <FontAwesome name="edit" size={20} color="#3b82f6" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Rename</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.optionButton}
                onPress={handleDuplicateDeck}
              >
                <View style={styles.optionIconContainer}>
                  <FontAwesome name="copy" size={20} color="#8b5cf6" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Duplicate</Text>
                </View>
              </Pressable>

              <Pressable style={styles.optionButton} onPress={handleDeleteDeck}>
                <View
                  style={[
                    styles.optionIconContainer,
                    styles.deleteIconContainer,
                  ]}
                >
                  <FontAwesome name="trash" size={20} color="#ef4444" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, styles.deleteText]}>
                    Delete
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}{" "}
      </BottomDrawer>

      {/* Delete Confirmation Modal */}
      <ModalDialog
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Deck"
        iconTitle={
          <View style={styles.deleteIconContainer}>
            <FontAwesome name="trash" size={20} color="#ef4444" />
          </View>
        }
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Are you sure you want to delete "{selectedDeck?.name}"?
          </Text>
          <Text style={styles.modalWarning}>This action cannot be undone.</Text>

          <View style={styles.modalButtons}>
            <Button
              variant="outline"
              size="large"
              onPress={() => setShowDeleteModal(false)}
              style={styles.modalButton}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="large"
              onPress={handleConfirmDelete}
              style={{ ...styles.modalButton, ...styles.deleteButton }}
              loading={deleting}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </View>
        </View>
      </ModalDialog>

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
  optionsWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  deleteIconContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
  },
  deleteText: {
    color: "#ef4444",
  },
  modalContent: {
    gap: 8,
  },
  modalText: {
    fontSize: 16,
    color: "#f1f5f9",
    lineHeight: 24,
  },
  modalWarning: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    borderColor: "#620404ff",
  },
});
