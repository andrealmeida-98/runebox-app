import { Card } from "@/interfaces/card";
import { db } from "../database";

export interface CardFilters {
  rarity?: string;
  cardType?: string;
  setAbv?: string;
  energy?: { value: number; operator: string };
  might?: { value: number; operator: string };
  domain?: string[];
  domainOperator?: "OR" | "AND";
  // Add more filters as needed
}

export async function getCards(
  searchQuery?: string,
  pageNum?: number
): Promise<Card[]> {
  const PAGE_SIZE = 20;
  const offset = pageNum ? (pageNum - 1) * PAGE_SIZE : 0;
  const searchPattern = searchQuery ? `%${searchQuery}%` : "%";

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

export async function getCardsBySetOrderedWithPagination(
  searchQuery?: string,
  pageNum?: number,
  filters?: CardFilters
): Promise<Card[]> {
  const PAGE_SIZE = 20;
  const offset = pageNum ? (pageNum - 1) * PAGE_SIZE : 0;
  const searchPattern = searchQuery ? `%${searchQuery}%` : "%";

  // Build WHERE clause based on filters
  const whereConditions = ["c.name LIKE ?"];
  const params: any[] = [searchPattern];

  if (filters?.rarity) {
    whereConditions.push("LOWER(c.rarity) = LOWER(?)");
    params.push(filters.rarity);
  }

  if (filters?.cardType) {
    whereConditions.push("LOWER(c.card_type) = LOWER(?)");
    params.push(filters.cardType);
  }

  if (filters?.setAbv) {
    whereConditions.push("c.set_abv = ?");
    params.push(filters.setAbv);
  }

  if (filters?.energy && filters.energy.value > 0) {
    whereConditions.push(`c.energy ${filters.energy.operator} ?`);
    params.push(filters.energy.value);
  }

  if (filters?.might && filters.might.value > 0) {
    whereConditions.push(`c.might ${filters.might.operator} ?`);
    params.push(filters.might.value);
  }

  if (filters?.domain && filters.domain.length > 0) {
    // Domain is stored as a JSON string, need to check if selected domains match
    const domainConditions = filters.domain.map(() => `c.domain LIKE ?`);
    const operator = filters.domainOperator === "AND" ? " AND " : " OR ";
    whereConditions.push(`(${domainConditions.join(operator)})`);
    filters.domain.forEach((domain) => {
      params.push(`%"${domain}"%`);
    });
  }

  const whereClause = whereConditions.join(" AND ");

  params.push(PAGE_SIZE, offset);

  return db.getAllAsync(
    `
        SELECT c.*
        FROM cards c
        JOIN sets s ON c.set_abv = s.set_abv
        WHERE ${whereClause}
        ORDER BY s.created_at DESC, c.id DESC
        LIMIT ? OFFSET ?
        `,
    params
  );
}

export async function getAllCardsBySetOrdered(
  searchQuery?: string
): Promise<Card[]> {
  const searchPattern = searchQuery ? `%${searchQuery}%` : "%";

  return db.getAllAsync(
    `
        SELECT c.*
        FROM cards c
        JOIN sets s ON c.set_abv = s.set_abv
        WHERE c.name LIKE ?
        ORDER BY s.created_at DESC, c.id DESC
        `,
    [searchPattern]
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

export async function getCardsBySetAbv(
  setAbv: string,
  limit?: number
): Promise<Card[]> {
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

export async function getCardsWithMostVariation(
  limit?: number
): Promise<Card[]> {
  return db.getAllAsync(
    `
        SELECT *
        FROM cards
        WHERE price_change IS NOT NULL
        ORDER BY price_change DESC
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

  // Ensure domain is always an array before stringifying
  const domainJson =
    Array.isArray(card.domain) && card.domain.length > 0
      ? JSON.stringify(card.domain)
      : "[]";

  await db.runAsync(
    `
        INSERT INTO cards (id, name, set_name, set_abv, image_url, ability, card_type, rarity, domain, energy, might, power, tags, price, price_foil, price_change, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          price_foil = excluded.price_foil,
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
      domainJson,
      card.energy ?? null,
      card.might ?? null,
      card.power ?? null,
      tagsJson,
      card.price ?? 0,
      card.price_foil ?? 0,
      card.price_change ?? null,
      timestamp,
    ]
  );
}

// Bulk upsert for better performance during sync
export async function upsertCards(cards: Card[]) {
  // Process cards sequentially without transaction wrapper
  // This prevents nested transaction issues during sync
  for (const card of cards) {
    await upsertCard(card);
  }
}
