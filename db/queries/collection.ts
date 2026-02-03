import { randomUUID } from "expo-crypto";
import { arrayKeysToCamelCase } from "../../utils/common";
import { db } from "../database";
import { CardCollection } from "./../../interfaces/card";
import { getCardsByIds } from "./cards";

/* =========================
   CREATE
========================= */

export async function createCollection(params: {
  user_id: string;
  name: string;
  color: string;
  icon: string;
}) {
  const id = randomUUID();
  const now = Date.now();

  await db.runAsync(
    `
    INSERT INTO collections (
      id, user_id, name, color, icon,
      card_count, total_value, updated_at
    )
    VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `,
    [id, params.user_id, params.name, params.color, params.icon, now]
  );

  return id;
}

/* =========================
   GET
========================= */

export async function getAllCollections(): Promise<CardCollection[]> {
  const collections = await db.getAllAsync(
    `
    SELECT *
    FROM collections
    ORDER BY updated_at DESC
    `
  );
  return arrayKeysToCamelCase(collections);
}

export async function getAllCollectionsWithStats(): Promise<CardCollection[]> {
  const collections = await getAllCollections();

  const collectionsWithStats = await Promise.all(
    collections.map(async (collection) => {
      const entries = await getCollectionEntries(collection.id);

      if (entries.length === 0) {
        return { ...collection, totalValue: 0, cardCount: 0 };
      }

      // Get cards for this collection
      const cardIds = entries.map((entry: any) => entry.card_id);
      const cards = await getCardsByIds(cardIds);

      // Calculate total value and card count
      let totalValue = 0;
      let cardCount = 0;

      entries.forEach((entry: any) => {
        const card = cards.find((c: any) => c.id === entry.card_id);
        if (card) {
          totalValue += (card.price || card.price_foil || 0) * entry.quantity;
          cardCount += entry.quantity;
        }
      });

      return {
        ...collection,
        totalValue,
        cardCount,
      };
    })
  );

  return collectionsWithStats;
}

export async function getCollectionById(collectionId: string) {
  return db.getFirstAsync(
    `
    SELECT *
    FROM collections
    WHERE id = ?
    `,
    [collectionId]
  );
}

export async function getCollectionsByUser(userId: string) {
  return db.getAllAsync(
    `
    SELECT *
    FROM collections
    WHERE user_id = ?
    ORDER BY updated_at DESC
    `,
    [userId]
  );
}

/* =========================
   UPDATE
========================= */

export async function updateCollection(
  collectionId: string,
  updates: {
    name?: string;
    color?: string;
    icon?: string;
  }
) {
  await db.runAsync(
    `
    UPDATE collections
    SET
      name = COALESCE(?, name),
      color = COALESCE(?, color),
      icon = COALESCE(?, icon),
      updated_at = ?
    WHERE id = ?
    `,
    [
      updates.name ?? null,
      updates.color ?? null,
      updates.icon ?? null,
      Date.now(),
      collectionId,
    ]
  );
}

/* =========================
   DELETE
========================= */

export async function deleteCollection(collectionId: string) {
  await db.runAsync(
    `
    DELETE FROM collections
    WHERE id = ?
    `,
    [collectionId]
  );
}

/* =========================
   COLLECTION ENTRIES
========================= */

export async function getCollectionEntries(collectionId: string) {
  return db.getAllAsync(
    `
    SELECT *
    FROM collection_entries
    WHERE collection_id = ?
    `,
    [collectionId]
  );
}

export async function addCardToCollection(
  collectionId: string,
  cardId: string,
  quantity: number = 1
) {
  const id = randomUUID();

  // Try to insert or update if exists
  await db.runAsync(
    `
    INSERT INTO collection_entries (id, collection_id, card_id, quantity)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(collection_id, card_id) 
    DO UPDATE SET quantity = quantity + ?
    `,
    [id, collectionId, cardId, quantity, quantity]
  );

  // Update collection stats
  await updateCollectionStats(collectionId);
}

export async function removeCardFromCollection(
  collectionId: string,
  cardId: string
) {
  await db.runAsync(
    `
    DELETE FROM collection_entries
    WHERE collection_id = ? AND card_id = ?
    `,
    [collectionId, cardId]
  );

  // Update collection stats
  await updateCollectionStats(collectionId);
}

export async function updateCardQuantityInCollection(
  collectionId: string,
  cardId: string,
  quantity: number
) {
  if (quantity <= 0) {
    await removeCardFromCollection(collectionId, cardId);
    return;
  }

  await db.runAsync(
    `
    UPDATE collection_entries
    SET quantity = ?
    WHERE collection_id = ? AND card_id = ?
    `,
    [quantity, collectionId, cardId]
  );

  // Update collection stats
  await updateCollectionStats(collectionId);
}

// Replace a card with a different version (different set/id)
export async function replaceCardInCollection(
  collectionId: string,
  oldCardId: string,
  newCardId: string,
  quantity: number
) {
  // Remove the old card
  await removeCardFromCollection(collectionId, oldCardId);

  // Add the new card with the specified quantity
  await addCardToCollection(collectionId, newCardId, quantity);
}

async function updateCollectionStats(collectionId: string) {
  // Update card count and total value
  await db.runAsync(
    `
    UPDATE collections
    SET
      card_count = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM collection_entries
        WHERE collection_id = ?
      ),
      total_value = (
        SELECT COALESCE(SUM(c.price * ce.quantity), 0)
        FROM collection_entries ce
        JOIN cards c ON ce.card_id = c.id
        WHERE ce.collection_id = ?
      ),
      updated_at = ?
    WHERE id = ?
    `,
    [collectionId, collectionId, Date.now(), collectionId]
  );
}
