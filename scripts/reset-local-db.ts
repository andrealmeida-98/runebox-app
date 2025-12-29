import { db } from "../db/database";
import { initDb } from "../db/initDb";

async function resetDatabase() {
  try {
    console.log("🔄 Dropping all tables...");

    // Drop all tables in order (child tables first due to foreign key constraints)
    await db.execAsync(`
      DROP TABLE IF EXISTS deck_entries;
      DROP TABLE IF EXISTS collection_entries;
      DROP TABLE IF EXISTS decks;
      DROP TABLE IF EXISTS collections;
      DROP TABLE IF EXISTS cards;
      DROP TABLE IF EXISTS sets;
      DROP TABLE IF EXISTS meta;
    `);

    console.log("✅ All tables dropped successfully");

    // Reinitialize the database
    console.log("🔄 Reinitializing database...");
    await initDb();
    console.log("✅ Database reinitialized successfully");
  } catch (error) {
    console.error("❌ Erro ao resetar DB:", error);
    throw error;
  }
}

// Chamar isto uma vez
resetDatabase();


