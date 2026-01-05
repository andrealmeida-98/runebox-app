import { Card, CardType } from "@/interfaces/card";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface CardGridItemProps {
  card: Card;
  cardWidth?: number;
  cardHeight?: number;
  onPress?: () => void;
  hidePrice?: boolean;
  quantity?: number;
}

export function CardGridItem({
  card,
  quantity = 0,
  cardWidth = 160,
  cardHeight = 200,
  hidePrice = false,
  onPress,
}: CardGridItemProps) {
  const { price = 0, price_foil = 0 } = card;
  const cardPrice = price ? price : price_foil;
  const [imageLoaded, setImageLoaded] = useState(false);

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
        {/* Placeholder image shown while loading */}
        {!imageLoaded && card.image_url && (
          <Image
            source={require("@/assets/images/back-image.png")}
            style={[
              styles.cardPlaceholder,
              card.card_type.toLocaleLowerCase() ===
                CardType.BATTLEFIELD.toLocaleLowerCase() && styles.rotated,
            ]}
            resizeMode="contain"
          />
        )}
        {/* Actual card image */}
        <Image
          source={
            card.image_url
              ? { uri: card.image_url }
              : require("@/assets/images/back-image.png")
          }
          style={[
            styles.cardPlaceholder,
            !imageLoaded && styles.hidden,
            card.card_type.toLocaleLowerCase() ===
              CardType.BATTLEFIELD.toLocaleLowerCase() && styles.rotated,
          ]}
          resizeMode="contain"
          onLoad={() => setImageLoaded(true)}
        />
        {/* Price Badge */}
        {!hidePrice && cardPrice && cardPrice > 0 ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{`$${cardPrice.toFixed(2)}`}</Text>
          </View>
        ) : null}

        {/* Quantity Badge */}
        {quantity > 0 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
        )}
      </View>

      {/* Card Info */}
      <Text style={styles.cardName} numberOfLines={1}>
        {card.name}
      </Text>
      <Text style={styles.cardSet}>{`${card.set_abv} • ${card.rarity}`}</Text>
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
  hidden: {
    opacity: 0,
    position: "absolute",
  },
  rotated: {
    transform: [{ rotate: "90deg" }],
    width: "140%",
    height: "140%",
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
