import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

import fs from "fs";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

function extractSetsFromCards(jsonData) {
  const setsMap = new Map();

  const idIndex = jsonData.names.indexOf("id");
  const setNameIndex = jsonData.names.indexOf("set_name");

  jsonData.data.forEach((card) => {
    const cardId = card[idIndex];
    const setName = card[setNameIndex];
    const abbreviation = cardId.split("-")[0];

    if (!setsMap.has(abbreviation)) {
      setsMap.set(abbreviation, {
        set_name: setName,
        set_abv: abbreviation,
        created_at: new Date().toISOString().split("T")[0], // Data fictícia
      });
    }
  });

  return Array.from(setsMap.values()).sort((a, b) =>
    a.set_abv.localeCompare(b.set_abv)
  );
}

/**
 * Insere os sets na Supabase
 */
async function insertSetsToSupabase() {
  try {
    console.log("📖 A ler ficheiro...");
    const rawData = fs.readFileSync("./data/cards.json", "utf8");
    const cardsData = JSON.parse(rawData);

    console.log("🔍 A extrair sets...");
    const sets = extractSetsFromCards(cardsData);

    console.log(`\n📊 ${sets.length} sets encontrados:`);
    sets.forEach((set) => {
      console.log(`  - ${set.set_abv}: ${set.set_name}`);
    });

    console.log("\n💾 A inserir na Supabase...");
    const { data, error } = await supabase
      .from("sets")
      .upsert(sets, {
        onConflict: "set_abv",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("❌ Erro ao inserir:", error);
      return;
    }

    console.log("✅ Sets inseridos com sucesso!");
    console.log(`\n📝 ${data.length} registos criados/atualizados:`);
    data.forEach((set) => {
      console.log(`  ID ${set.id}: ${set.set_abv} - ${set.set_name}`);
    });
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

insertSetsToSupabase().catch((err) => {
  console.error("💥 Insert sets failed", err);
  process.exit(1);
});
