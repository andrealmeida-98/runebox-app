import { db } from "../database";

/**
 * Migration: Add default value to price column
 *
 * This migration updates the cards table to allow price to have a default value of 0
 * to handle cards that don't have pricing information yet.
 */
export async function migrateAddDefaultPrice() {
  try {
    console.log("🔄 Running migration: Add default price...");

    // SQLite doesn't support ALTER COLUMN directly, so we need to:
    // 1. Create a new table with the correct schema
    // 2. Copy data from old table
    // 3. Drop old table
    // 4. Rename new table

    await db.execAsync(`
      BEGIN TRANSACTION;

      -- Create new table with updated schema
      CREATE TABLE IF NOT EXISTS cards_new (
        id TEXT PRIMARY KEY,

        set_name TEXT NOT NULL,
        set_abv TEXT NOT NULL,

        image_url TEXT,
        name TEXT NOT NULL,

        card_type TEXT NOT NULL,
        rarity TEXT NOT NULL,

        domain TEXT,
        energy INTEGER,
        might INTEGER,
        power INTEGER,

        tags TEXT,
        ability TEXT,

        price REAL NOT NULL DEFAULT 0,
        price_change REAL,

        updated_at INTEGER
      );

      -- Copy existing data (using COALESCE to handle any null prices)
      INSERT INTO cards_new (id, set_name, set_abv, image_url, name, card_type, rarity, domain, energy, might, power, tags, ability, price, price_change, updated_at)
      SELECT id, set_name, set_abv, image_url, name, card_type, rarity, domain, energy, might, power, tags, ability, COALESCE(price, 0), price_change, updated_at
      FROM cards;

      -- Drop old table
      DROP TABLE cards;

      -- Rename new table
      ALTER TABLE cards_new RENAME TO cards;

      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
      CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_abv);

      COMMIT;
    `);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}
