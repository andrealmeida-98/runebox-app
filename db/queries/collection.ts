import { randomUUID } from "expo-crypto";
import { arrayKeysToCamelCase } from "../../utils/common";
import { db } from "../database";
import { CardCollection } from "./../../interfaces/card";

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
