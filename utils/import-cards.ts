import { db } from "@/db/database";

interface ParsedCard {
  quantity: number;
  cardName: string;
  setCode: string;
}

/**
 * Parse a line of card import text
 * Format: "1 Annie - Dark Child - Starter (OGS-017)"
 * or: "3 Ride the Wind (OGN-173)"
 */
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

/**
 * Parse multiple lines of card import text
 */
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

/**
 * Find a card in the database by name and set code
 */
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

/**
 * Import cards into a collection from parsed card data
 */
export async function importCardsToCollection(
  collectionId: string,
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

      // Check if card already exists in collection
      const existingEntry = await db.getAllAsync(
        `SELECT * FROM collection_entries WHERE collection_id = ? AND card_id = ? LIMIT 1`,
        [collectionId, card.id]
      );

      if (existingEntry.length > 0) {
        // Update quantity
        await db.runAsync(
          `UPDATE collection_entries SET quantity = quantity + ? WHERE collection_id = ? AND card_id = ?`,
          [parsedCard.quantity, collectionId, card.id]
        );
      } else {
        // Insert new entry
        await db.runAsync(
          `INSERT INTO collection_entries (collection_id, card_id, quantity) VALUES (?, ?, ?)`,
          [collectionId, card.id, parsedCard.quantity]
        );
      }

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
