import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

import { parseCardsFromJson } from "./importCards.js";
import { upsertInChunks } from "./upsertInChunks.js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function syncCards() {
  console.log("🚀 Starting card sync");

  if (
    !process.env.EXPO_PUBLIC_SUPABASE_URL ||
    !process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  if (supabase === null) {
    throw new Error("Failed to create Supabase client");
  }

  const cards = parseCardsFromJson("./data/cards.json");

  await upsertInChunks(supabase, "cards", cards, { onConflict: "id" });

  console.log("🎉 Card sync finished");
}

syncCards().catch((err) => {
  console.error("💥 Sync failed", err);
  process.exit(1);
});
