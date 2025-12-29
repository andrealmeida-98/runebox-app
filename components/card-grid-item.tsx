import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface CardGridItemProps {
  card: {
    id: string;
    name: string;
    set_abv: string;
    rarity: string;
    price?: number;
    quantity?: number;
    image_url?: string;
  };
  cardWidth?: number;
  cardHeight?: number;
  onPress?: () => void;
  hidePrice?: boolean;
}

export function CardGridItem({
  card,
  cardWidth = 160,
  cardHeight = 200,
  hidePrice = false,
  onPress,
}: CardGridItemProps) {
  return (
    <Pressable
      key={card.id}
      style={[styles.cardContainer, { width: cardWidth }]}
      onPress={onPress}
    >
      {/* Card Image */}
      <View
        style={[styles.cardImage, { width: cardWidth, height: cardHeight }]}
      >
        <Image
          source={
            card.image_url
              ? { uri: card.image_url }
              : require("@/assets/images/riftbound-card-example.png")
          }
          style={styles.cardPlaceholder}
          resizeMode="contain"
        />
        {/* Price Badge */}
        {card.price && !hidePrice && card.price > 0 ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{`$${card.price.toFixed(2)}`}</Text>
          </View>
        ) : null}

        {/* Quantity Badge */}
        {card.quantity && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{card.quantity}</Text>
          </View>
        )}
      </View>

      {/* Card Info */}
      <Text style={styles.cardName} numberOfLines={1}>
        {card.name}
      </Text>
      <Text style={styles.cardSet}>
        {`${card.set_abv} • ${card.rarity}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    // Width is set dynamically via props
  },
  cardImage: {
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
});
