import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { USER_DECKS } from "@/dummy-data";

export default function DecksScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Decks</Text>
        <Pressable style={styles.addButton}>
          <FontAwesome name="plus" size={20} color="#ffffff" />
        </Pressable>
      </View>

      <FlatList
        data={USER_DECKS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
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
              source={require("@/assets/images/riftbound-card-example.png")}
              style={styles.deckBackground}
              imageStyle={styles.backgroundImage}
            >
              <View style={styles.deckOverlay}>
                <View style={styles.deckHeader}>
                  <Text style={styles.deckTitle}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.deckSubtitle}>{item.description}</Text>
                  )}
                </View>

                <View style={styles.deckStats}>
                  <View style={styles.statBox}>
                    <View style={styles.statIconContainer}>
                      <FontAwesome name="clone" size={16} color="#94a3b8" />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text style={styles.statValue}>{item.cardCount}</Text>
                      <Text style={styles.statLabel}>Cards</Text>
                    </View>
                  </View>

                  <View style={[styles.statBox, styles.statBoxLast]}>
                    <View style={styles.statIconContainer}>
                      <FontAwesome name="dollar" size={16} color="#22c55e" />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text style={[styles.statValue, styles.priceValue]}>
                        {item.totalValue.toFixed(0)}
                      </Text>
                      <Text style={styles.statLabel}>Value</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerTitle: {
    fontSize: 28,
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
    padding: 16,
  },
  deckCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deckBackground: {
    width: "100%",
    height: 200,
  },
  backgroundImage: {
    borderRadius: 16,
    opacity: 0.3,
  },
  deckOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    padding: 20,
    justifyContent: "space-between",
  },
  deckHeader: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  deckSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  deckStats: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.2)",
  },
  statBoxLast: {
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
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
});
