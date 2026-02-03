import { randomUUID } from "expo-crypto";
import { db } from "../database";

/* =========================
   CREATE
========================= */

export async function createDeck(params: {
  user_id: string;
  name: string;
  description?: string;
}) {
  const id = randomUUID();
  const now = Date.now();

  await db.runAsync(
    `
    INSERT INTO decks (
      id, user_id, name, description,
      card_count, total_value, updated_at
    )
    VALUES (?, ?, ?, ?, 0, 0, ?)
    `,
    [id, params.user_id, params.name, params.description ?? null, now]
  );

  return id;
}

/* =========================
   GET
========================= */

export async function getAllDecks() {
  return db.getAllAsync(
    `
    SELECT *
    FROM decks
    ORDER BY updated_at DESC
    `
  );
}

export async function getDeckById(deckId: string) {
  return db.getFirstAsync(
    `
    SELECT *
    FROM decks
    WHERE id = ?
    `,
    [deckId]
  );
}

export async function getDecksByUser(userId: string) {
  return db.getAllAsync(
    `
    SELECT *
    FROM decks
    WHERE user_id = ?
    ORDER BY updated_at DESC
    `,
    [userId]
  );
}

export async function getDeckEntriesWithCards(deckId: string) {
  return db.getAllAsync(
    `
    SELECT 
      de.id,
      de.deck_id,
      de.card_id,
      de.quantity,
      c.*
    FROM deck_entries de
    INNER JOIN cards c ON de.card_id = c.id
    WHERE de.deck_id = ?
    ORDER BY c.card_type, c.name
    `,
    [deckId]
  );
}

export async function getLegendCardForDeck(deckId: string) {
  return db.getFirstAsync(
    `
    SELECT c.*
    FROM deck_entries de
    INNER JOIN cards c ON de.card_id = c.id
    WHERE de.deck_id = ? AND c.card_type = 'Legend'
    LIMIT 1
    `,
    [deckId]
  );
}

/* =========================
   UPDATE
========================= */

export async function updateDeck(
  deckId: string,
  updates: {
    name?: string;
    description?: string;
  }
) {
  await db.runAsync(
    `
    UPDATE decks
    SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      updated_at = ?
    WHERE id = ?
    `,
    [updates.name ?? null, updates.description ?? null, Date.now(), deckId]
  );
}

/* =========================
   DELETE
========================= */

export async function deleteDeck(deckId: string) {
  await db.runAsync(
    `
    DELETE FROM decks
    WHERE id = ?
    `,
    [deckId]
  );
}

/* =========================
   DECK ENTRIES
========================= */

export async function addCardToDeck(
  deckId: string,
  cardId: string,
  quantity: number
) {
  const randomUUID = (await import("expo-crypto")).randomUUID;
  const id = randomUUID();

  // Check if card already exists in deck
  const existing = await db.getFirstAsync(
    `SELECT * FROM deck_entries WHERE deck_id = ? AND card_id = ? LIMIT 1`,
    [deckId, cardId]
  );

  if (existing) {
    // Update quantity
    await db.runAsync(
      `UPDATE deck_entries SET quantity = quantity + ? WHERE deck_id = ? AND card_id = ?`,
      [quantity, deckId, cardId]
    );
  } else {
    // Insert new entry
    await db.runAsync(
      `INSERT INTO deck_entries (id, deck_id, card_id, quantity) VALUES (?, ?, ?, ?)`,
      [id, deckId, cardId, quantity]
    );
  }

  // Update deck card count
  await updateDeckCardCount(deckId);
}

export async function updateDeckCardCount(deckId: string) {
  const result = await db.getFirstAsync(
    `SELECT SUM(quantity) as total FROM deck_entries WHERE deck_id = ?`,
    [deckId]
  );

  const total = (result as any)?.total || 0;

  await db.runAsync(
    `UPDATE decks SET card_count = ?, updated_at = ? WHERE id = ?`,
    [total, Date.now(), deckId]
  );
}

export async function updateCardQuantityInDeck(
  deckId: string,
  cardId: string,
  quantity: number
) {
  if (quantity <= 0) {
    // Remove the card entry if quantity is 0 or less
    await db.runAsync(
      `DELETE FROM deck_entries WHERE deck_id = ? AND card_id = ?`,
      [deckId, cardId]
    );
  } else {
    // Update the quantity
    await db.runAsync(
      `UPDATE deck_entries SET quantity = ? WHERE deck_id = ? AND card_id = ?`,
      [quantity, deckId, cardId]
    );
  }

  // Update deck card count
  await updateDeckCardCount(deckId);
}

export async function removeCardFromDeck(deckId: string, cardId: string) {
  await db.runAsync(
    `DELETE FROM deck_entries WHERE deck_id = ? AND card_id = ?`,
    [deckId, cardId]
  );

  // Update deck card count
  await updateDeckCardCount(deckId);
}

export async function replaceCardInDeck(
  deckId: string,
  oldCardId: string,
  newCardId: string,
  quantity: number
) {
  // Remove old card
  await db.runAsync(
    `DELETE FROM deck_entries WHERE deck_id = ? AND card_id = ?`,
    [deckId, oldCardId]
  );

  // Add new card or update if exists
  const existing = await db.getAllAsync(
    `SELECT * FROM deck_entries WHERE deck_id = ? AND card_id = ?`,
    [deckId, newCardId]
  );

  if (existing.length > 0) {
    // Update existing entry
    await db.runAsync(
      `UPDATE deck_entries SET quantity = quantity + ? WHERE deck_id = ? AND card_id = ?`,
      [quantity, deckId, newCardId]
    );
  } else {
    // Insert new entry
    await db.runAsync(
      `INSERT INTO deck_entries (id, deck_id, card_id, quantity) VALUES (?, ?, ?, ?)`,
      [Date.now().toString(), deckId, newCardId, quantity]
    );
  }

  // Update deck card count
  await updateDeckCardCount(deckId);
}

/* =========================
   IMPORT
========================= */

interface ParsedCard {
  quantity: number;
  cardName: string;
  setCode: string;
}

async function findCard(
  cardName: string,
  setCode: string
): Promise<{ id: string; name: string } | null> {
  // First try exact match with set code
  const setAbv = setCode.split("-")[0];

  // Try to find by name and set abbreviation
  const cards = await db.getAllAsync(
    `SELECT * FROM cards WHERE name = ? AND set_abv = ? LIMIT 1`,
    [cardName, setAbv]
  );

  if (cards.length > 0) {
    return cards[0] as { id: string; name: string };
  }

  // Fallback: try just by name (case-insensitive)
  const cardsByName = await db.getAllAsync(
    `SELECT * FROM cards WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    [cardName]
  );

  return cardsByName.length > 0
    ? (cardsByName[0] as { id: string; name: string })
    : null;
}

export function parseCardLine(line: string): ParsedCard | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  // Match pattern: number, then card name, then (SET-NUMBER) at the end
  const match = trimmedLine.match(/^(\d+)\s+(.+?)\s+\(([A-Z]+-\d+)\)$/i);

  if (!match) {
    console.warn(`Could not parse line: ${line}`);
    return null;
  }

  const [, quantityStr, cardName, setCode] = match;

  return {
    quantity: parseInt(quantityStr, 10),
    cardName: cardName.trim(),
    setCode: setCode.trim().toUpperCase(),
  };
}

export function parseCardImportText(text: string): ParsedCard[] {
  const lines = text.split("\n");
  const parsedCards: ParsedCard[] = [];

  for (const line of lines) {
    const parsed = parseCardLine(line);
    if (parsed) {
      parsedCards.push(parsed);
    }
  }

  return parsedCards;
}

export async function importCardsToDeck(
  deckId: string,
  parsedCards: ParsedCard[]
): Promise<{
  success: number;
  failed: number;
  totalQuantity: number;
  errors: string[];
}> {
  let success = 0;
  let failed = 0;
  let totalQuantity = 0;
  const errors: string[] = [];

  for (const parsedCard of parsedCards) {
    try {
      // Find the card in the database
      const card = await findCard(parsedCard.cardName, parsedCard.setCode);

      if (!card) {
        errors.push(
          `Card not found: ${parsedCard.cardName} (${parsedCard.setCode})`
        );
        failed++;
        continue;
      }

      // Add card to deck
      await addCardToDeck(deckId, card.id, parsedCard.quantity);

      success++;
      totalQuantity += parsedCard.quantity;
    } catch (error) {
      console.error(`Error importing card ${parsedCard.cardName}:`, error);
      errors.push(`Error importing ${parsedCard.cardName}: ${error}`);
      failed++;
    }
  }

  return { success, failed, totalQuantity, errors };
}
