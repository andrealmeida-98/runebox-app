import { Card } from "@/interfaces/card";
import { db } from "../database";

export async function getCards(searchQuery?: string, pageNum?: number): Promise<Card[]> {
  const PAGE_SIZE = 20;
  const offset = pageNum ? (pageNum - 1) * PAGE_SIZE : 0;
  const searchPattern = searchQuery ? `%${searchQuery}%` : '%';
  
  return db.getAllAsync(
    `
        SELECT *
        FROM cards
        WHERE name LIKE ?
        ORDER BY updated_at DESC, id DESC
        LIMIT ? OFFSET ?
        `,
    [searchPattern, PAGE_SIZE, offset]
  );
}

export async function getCardById(id: string) {
  return db.getFirstAsync(
    `
        SELECT *
        FROM cards
        WHERE id = ?
        `,
    [id]
  );
}

export async function getCardsBySet(set: string) {
  return db.getAllAsync(
    `
        SELECT *
        FROM cards
        WHERE set = ?
        `,
    [set]
  );
}

export async function getCardsBySetAbv(setAbv: string, limit?: number): Promise<Card[]> {
  return db.getAllAsync(
    `
        SELECT *
        FROM cards
        WHERE set_abv = ?
        ORDER BY price DESC
        LIMIT ?
        `,
    [setAbv, limit ?? 10]
  );
}

export async function getCardsWithMostVariation(ascent: boolean, limit?:number): Promise<Card[]> {
  return db.getAllAsync(
    `
        SELECT *
        FROM cards
        WHERE price_change IS NOT NULL
        ORDER BY price_change ${ascent ? "ASC" : "DESC"}
        LIMIT ${limit ?? 3}
        `
  );
}

export async function upsertCard(
  card: Card,
  updatedAt?: number
): Promise<void> {
  // Use provided updatedAt or current timestamp
  const timestamp = updatedAt ?? Date.now();

  // Ensure tags is always an array before stringifying
  const tagsJson =
    Array.isArray(card.tags) && card.tags.length > 0
      ? JSON.stringify(card.tags)
      : "[]";

  return db.runAsync(
    `
        INSERT INTO cards (id, name, set_name, set_abv, image_url, ability, card_type, rarity, domain, energy, might, power, tags, price, price_change, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          set_name = excluded.set_name,
          set_abv = excluded.set_abv,
          image_url = excluded.image_url,
          ability = excluded.ability,
          card_type = excluded.card_type,
          rarity = excluded.rarity,
          domain = excluded.domain,
          energy = excluded.energy,
          might = excluded.might,
          power = excluded.power,
          tags = excluded.tags,
          price = excluded.price,
          price_change = excluded.price_change,
          updated_at = excluded.updated_at
        `,
    [
      String(card.id),
      String(card.name),
      String(card.set_name),
      String(card.set_abv),
      card.image_url ?? null,
      card.ability ?? null,
      String(card.card_type),
      String(card.rarity),
      card.domain ?? null,
      card.energy ?? null,
      card.might ?? null,
      card.power ?? null,
      tagsJson,
      card.price ?? 0,
      card.price_change ?? null,
      timestamp,
    ]
  );
}

// Bulk upsert for better performance during sync
export async function upsertCards(cards: Card[]) {
  return db.withTransactionAsync(async () => {
    for (const card of cards) {
      await upsertCard(card);
    }
  });
}
