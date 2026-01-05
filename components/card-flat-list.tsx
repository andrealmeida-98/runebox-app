import { Card } from "@/interfaces/card";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CardGridItem } from "./card-grid-item";

interface CardFlatListProps {
  cards: Card[];
  loading?: boolean;
  loadingMore?: boolean;
  onEndReached?: () => void;
  onCardPress?: (card: Card) => void;
  numColumns?: number;
  emptyMessage?: string;
  emptySubtext?: string;
}

export function CardFlatList({
  cards,
  loading = false,
  loadingMore = false,
  onEndReached,
  onCardPress,
  numColumns = 3,
  emptyMessage = "No cards found",
  emptySubtext = "Try adjusting your search",
}: CardFlatListProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - (numColumns - 1) * 16) / numColumns;

  const renderCard = ({ item }: { item: Card }) => (
    <View style={styles.cardWrapper}>
      <CardGridItem
        card={item}
        cardWidth={cardWidth}
        cardHeight={cardWidth * 1.4}
        onPress={() => onCardPress?.(item)}
        hidePrice
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => item.id}
      renderItem={renderCard}
      numColumns={numColumns}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      onEndReached={onEndReached}
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
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          <Text style={styles.emptySubtext}>{emptySubtext}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "flex-start",
    marginBottom: 16,
    gap: 16,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
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
});
