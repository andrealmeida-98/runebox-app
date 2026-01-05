import { db } from "./database";

export async function initDb() {
  await db.execAsync(`
    -- =========================
    -- SETS
    -- =========================
    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY,
      set_name TEXT NOT NULL,
      set_abv TEXT NOT NULL,
      created_at INTEGER
    ); 

    CREATE INDEX IF NOT EXISTS idx_sets_name
      ON sets(set_name);

    CREATE INDEX IF NOT EXISTS idx_sets_abv
      ON sets(set_abv);

    -- =========================
    -- CARDS
    -- =========================
    CREATE TABLE IF NOT EXISTS cards (
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

      tags TEXT, -- JSON string
      ability TEXT,

      price REAL NOT NULL DEFAULT 0,
      price_foil REAL NOT NULL DEFAULT 0,
      price_change REAL,

      updated_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_cards_name
      ON cards(name);

    CREATE INDEX IF NOT EXISTS idx_cards_set
      ON cards(set_abv);

    -- =========================
    -- COLLECTIONS
    -- =========================
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,

      name TEXT NOT NULL,

      total_value REAL NOT NULL DEFAULT 0,
      card_count INTEGER NOT NULL DEFAULT 0,

      color TEXT NOT NULL,
      icon TEXT NOT NULL,

      updated_at INTEGER
    );

    -- =========================
    -- COLLECTION ENTRIES
    -- =========================
    CREATE TABLE IF NOT EXISTS collection_entries (
      id TEXT PRIMARY KEY,

      collection_id TEXT NOT NULL,
      card_id TEXT NOT NULL,

      quantity INTEGER NOT NULL,

      FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE,

      UNIQUE(collection_id, card_id)
    );

    -- =========================
    -- DECKS
    -- =========================
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,

      name TEXT NOT NULL,
      description TEXT,

      total_value REAL NOT NULL DEFAULT 0,
      card_count INTEGER NOT NULL DEFAULT 0,

      updated_at INTEGER
    );

    -- =========================
    -- DECK ENTRIES
    -- =========================
    CREATE TABLE IF NOT EXISTS deck_entries (
      id TEXT PRIMARY KEY,

      deck_id TEXT NOT NULL,
      card_id TEXT NOT NULL,

      quantity INTEGER NOT NULL,

      FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE,
      FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE,

      UNIQUE(deck_id, card_id)
    );

    -- =========================
    -- META (sync, versioning, etc)
    -- =========================
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

/**
 * Drop and recreate the cards table with the updated schema
 * Use this if you need to fix the schema after the app has already created the old table
 */
export async function resetCardsTable() {
  try {
    console.log("🔄 Resetting cards table...");

    await db.execAsync(`
      DROP TABLE IF EXISTS cards;
      
      CREATE TABLE cards (
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

      CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
      CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_abv);
    `);

    console.log("✅ Cards table reset successfully!");
  } catch (error) {
    console.error("❌ Failed to reset cards table:", error);
    throw error;
  }
}

/**
 * Drop and recreate the sets table with the updated schema
 * Use this if you need to fix the schema after the app has already created the old table
 * This ensures the table has the id column which is required for syncing with Supabase
 */
export async function resetSetsTable() {
  try {
    console.log("🔄 Resetting sets table...");

    // Use individual runAsync calls instead of execAsync to avoid transaction issues
    await db.runAsync(`DROP TABLE IF EXISTS sets`);

    await db.runAsync(`
      CREATE TABLE sets (
        id TEXT PRIMARY KEY,
        set_name TEXT NOT NULL,
        set_abv TEXT NOT NULL,
        created_at INTEGER
      )
    `);

    await db.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_sets_name ON sets(set_name)`
    );
    await db.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_sets_abv ON sets(set_abv)`
    );

    console.log("✅ Sets table reset successfully!");
  } catch (error) {
    console.error("❌ Failed to reset sets table:", error);
    throw error;
  }
}
