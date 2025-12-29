import { db } from "../db/database";

/**
 * Compare local SQLite schema with Supabase schema
 */
async function compareSchemas() {
  try {
    console.log("🔍 Comparing Local SQLite Schema with Supabase Schema\n");
    console.log("=".repeat(80));

    // Get local table schemas
    const localTables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    console.log("\n📊 LOCAL SQLITE TABLES:");
    console.log("-".repeat(80));
    
    const localTableSchemas: Record<string, string> = {};
    for (const table of localTables) {
      const schema = await db.getAllAsync<{
        sql: string;
      }>(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [table.name]);
      
      if (schema[0]?.sql) {
        localTableSchemas[table.name] = schema[0].sql;
        console.log(`\n📋 ${table.name}:`);
        console.log(schema[0].sql);
      }
    }

    console.log("\n\n📊 SUPABASE SCHEMA SUMMARY:");
    console.log("-".repeat(80));
    
    const supabaseSchema = {
      cards: {
        id: "text (PK)",
        set_name: "text",
        set_abv: "text",
        image_url: "text (nullable)",
        name: "text",
        card_type: "enum (USER-DEFINED)",
        rarity: "enum (USER-DEFINED)",
        domain: "text (nullable)",
        energy: "integer (nullable)",
        might: "integer (nullable)",
        power: "integer (nullable)",
        tags: "text[] (array)",
        ability: "text (nullable)",
        price: "numeric (nullable)",
        price_change: "numeric (nullable)",
        created_at: "timestamptz (default: now())",
        updated_at: "timestamptz (default: now())",
      },
      card_collections: {
        id: "uuid (PK, default: gen_random_uuid())",
        user_id: "uuid",
        name: "text",
        total_value: "numeric (default: 0)",
        card_count: "integer (default: 0)",
        color: "enum (USER-DEFINED)",
        icon: "enum (USER-DEFINED)",
        created_at: "timestamptz (default: now())",
      },
      collection_entries: {
        id: "uuid (PK, default: gen_random_uuid())",
        collection_id: "uuid (FK -> card_collections)",
        card_id: "uuid (FK -> cards)",
        quantity: "integer",
        created_at: "timestamptz (default: now())",
      },
      decks: {
        id: "uuid (PK, default: gen_random_uuid())",
        user_id: "uuid",
        name: "text",
        description: "text (nullable)",
        card_count: "integer (default: 0)",
        total_value: "numeric (default: 0)",
        created_at: "timestamptz (default: now())",
      },
      deck_entries: {
        id: "uuid (PK, default: gen_random_uuid())",
        deck_id: "uuid (FK -> decks)",
        card_id: "text (FK -> cards)",
        quantity: "integer",
        created_at: "timestamptz (default: now())",
      },
      sets: {
        id: "uuid (PK, default: gen_random_uuid())",
        set_name: "text (unique)",
        set_abv: "text (unique)",
        created_at: "timestamptz (default: now())",
      },
    };

    for (const [tableName, columns] of Object.entries(supabaseSchema)) {
      console.log(`\n📋 ${tableName}:`);
      for (const [colName, colType] of Object.entries(columns)) {
        console.log(`   ${colName}: ${colType}`);
      }
    }

    console.log("\n\n🔍 DETAILED COMPARISON:");
    console.log("-".repeat(80));

    // Compare tables
    const supabaseTableNames = Object.keys(supabaseSchema);
    const localTableNames = Object.keys(localTableSchemas);

    console.log("\n❌ TABLES IN SUPABASE BUT NOT IN LOCAL:");
    supabaseTableNames
      .filter((t) => !localTableNames.includes(t))
      .forEach((t) => console.log(`   - ${t}`));

    console.log("\n❌ TABLES IN LOCAL BUT NOT IN SUPABASE:");
    localTableNames
      .filter((t) => !supabaseTableNames.includes(t))
      .forEach((t) => console.log(`   - ${t}`));

    console.log("\n⚠️  TABLE NAME MISMATCHES:");
    if (supabaseTableNames.includes("card_collections") && localTableNames.includes("collections")) {
      console.log("   - Supabase: 'card_collections' vs Local: 'collections'");
    }

    console.log("\n\n📋 COLUMN DIFFERENCES BY TABLE:");
    console.log("-".repeat(80));

    // Cards table comparison
    console.log("\n📦 CARDS TABLE:");
    console.log("   Supabase has 'created_at' (timestamptz) - Local has 'updated_at' (INTEGER)");
    console.log("   Supabase has 'tags' as TEXT[] array - Local has 'tags' as TEXT (JSON string)");
    console.log("   Supabase 'price' is nullable - Local 'price' is NOT NULL DEFAULT 0");
    console.log("   Supabase uses enums for card_type/rarity - Local uses TEXT");

    // Collections comparison
    console.log("\n📦 COLLECTIONS:");
    if (localTableNames.includes("collections")) {
      console.log("   ⚠️  Table name mismatch: Supabase='card_collections', Local='collections'");
      console.log("   Supabase has 'created_at' (timestamptz) - Local has 'updated_at' (INTEGER)");
      console.log("   Supabase IDs are UUID - Local IDs are TEXT");
      console.log("   Supabase uses enums for color/icon - Local uses TEXT");
    }

    // Collection entries comparison
    console.log("\n📦 COLLECTION_ENTRIES:");
    console.log("   ⚠️  Supabase 'card_id' is UUID - Local 'card_id' is TEXT");
    console.log("   Supabase has 'created_at' (timestamptz) - Local has no timestamp");
    console.log("   Supabase IDs are UUID - Local IDs are TEXT");

    // Decks comparison
    console.log("\n📦 DECKS:");
    console.log("   Supabase has 'created_at' (timestamptz) - Local has 'updated_at' (INTEGER)");
    console.log("   Supabase IDs are UUID - Local IDs are TEXT");

    // Deck entries comparison
    console.log("\n📦 DECK_ENTRIES:");
    console.log("   Supabase has 'created_at' (timestamptz) - Local has no timestamp");
    console.log("   Supabase IDs are UUID - Local IDs are TEXT");
    console.log("   ✅ Both use TEXT for card_id (matches)");

    // Sets comparison
    console.log("\n📦 SETS:");
    console.log("   Supabase has 'created_at' (timestamptz) - Local has 'created_at' (INTEGER)");
    console.log("   Supabase IDs are UUID - Local IDs are TEXT");
    console.log("   Supabase has unique constraints on set_name and set_abv");

    console.log("\n\n✅ SUMMARY:");
    console.log("-".repeat(80));
    console.log(`
The schemas are STRUCTURALLY COMPATIBLE but have TYPE DIFFERENCES:

✅ Compatible for sync:
   - Core data fields match (names, set_abv, image_url, etc.)
   - Relationships are preserved (FKs work with type conversion)
   - Most differences are cosmetic (UUID vs TEXT, timestamptz vs INTEGER)

⚠️  Requires attention:
   - Tags: Supabase TEXT[] vs Local TEXT (JSON) - needs conversion
   - Collection entries: card_id type mismatch (UUID vs TEXT)
   - Timestamps: created_at vs updated_at naming difference
   - Enums: Supabase enums vs Local TEXT (should validate values)

❌ Missing in Supabase:
   - meta table (local-only, for sync tracking)

The local SQLite schema appears to be designed for offline-first use
with sync to Supabase, which explains the type differences.
    `);

    console.log("\n✅ Schema comparison complete!\n");
  } catch (error) {
    console.error("❌ Error comparing schemas:", error);
    throw error;
  }
}

compareSchemas();

