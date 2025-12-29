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
