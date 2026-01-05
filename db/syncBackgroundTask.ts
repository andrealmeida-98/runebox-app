import { Card } from "@/interfaces/card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { resetSetsTable } from "./initDb";
import { upsertCard } from "./queries/cards";
import { upsertSets } from "./queries/sets";
import {
  convertSupabaseCardToLocal,
  convertSupabaseSetToLocal,
} from "./syncUtils";

const BACKGROUND_FETCH_TASK = "background-card-sync";
const SYNC_INTERVAL = 60 * 15; // 15 minutes (minimum allowed)
const LAST_SYNC_KEY = "lastCardSyncTimestamp";

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("[Background Task] Starting sync...");

    // Get last sync timestamp
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
    const now = Date.now();

    // Fetch sets and cards from Supabase
    const cards = await fetchCardsFromSupabase(lastSync);
    const sets = await fetchSetsFromSupabase(lastSync);

    if ((!cards || cards.length === 0) && (!sets || sets.length === 0)) {
      console.log("[Background Task] No new data to sync");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Update local database
    if (cards && cards.length > 0) {
      await updateLocalDatabase(cards);
    }
    if (sets && sets.length > 0) {
      await updateLocalSetsDatabase(sets);
    }

    // Save the timestamp of last sync
    await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());

    console.log(
      `[Background Task] Sync completed! Updated ${cards.length} cards and ${sets.length} sets`
    );

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[Background Task] Error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Fetch cards from Supabase
async function fetchCardsFromSupabase(
  lastSync: number
): Promise<{ card: Card; updatedAt: number }[]> {
  try {
    // Get Supabase URL and key from environment or config
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found");
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch cards - only updated after last sync (if this is not the first sync)
    if (lastSync > 0) {
      // Convert milliseconds timestamp to ISO string for Supabase timestampz comparison
      const lastSyncISO = new Date(lastSync).toISOString();

      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .gt("updated_at", lastSyncISO);
      if (error) {
        console.error("[Background Task] Supabase error:", error);
        throw error;
      }

      console.log(
        `[Background Task] Fetched ${data?.length || 0} updated cards`
      );
      // Convert Supabase format to local Card format
      return (data || []).map((item) => convertSupabaseCardToLocal(item));
    } else {
      // First sync - fetch all cards
      const { data, error } = await supabase.from("cards").select("*");

      if (error) {
        console.error("[Background Task] Supabase error:", error);
        throw error;
      }

      console.log(
        `[Background Task] Fetched ${data?.length || 0} cards (initial sync)`
      );
      // Convert Supabase format to local Card format
      return (data || []).map((item) => convertSupabaseCardToLocal(item));
    }
  } catch (error) {
    console.error("[Background Task] Error fetching from Supabase:", error);
    throw error;
  }
}

// Fetch sets from Supabase
async function fetchSetsFromSupabase(lastSync: number): Promise<any[]> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (lastSync > 0) {
      const lastSyncISO = new Date(lastSync).toISOString();

      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .gt("created_at", lastSyncISO); // Note: Assuming created_at is used for sync as well
      if (error) {
        console.error("[Background Task] Supabase error:", error);
        throw error;
      }
      console.log(
        `[Background Task] Fetched ${data?.length || 0} updated sets`
      );
      // Convert Supabase format to local Set format
      return (data || []).map(convertSupabaseSetToLocal);
    } else {
      const { data, error } = await supabase.from("sets").select("*");

      if (error) {
        console.error("[Background Task] Supabase error:", error);
        throw error;
      }

      console.log(
        `[Background Task] Fetched ${data?.length || 0} sets (initial sync)`
      );
      // Convert Supabase format to local Set format
      return (data || []).map(convertSupabaseSetToLocal);
    }
  } catch (error) {
    console.error("Error fetching sets from Supabase:", error);
    throw error;
  }
}

// Update local SQLite database with cards
async function updateLocalDatabase(
  convertedCards: { card: Card; updatedAt: number }[]
): Promise<void> {
  try {
    // Process cards sequentially without explicit transaction wrapper
    // Each upsertCard uses runAsync which is safe
    for (const { card, updatedAt } of convertedCards) {
      await upsertCard(card, updatedAt);
    }

    console.log(
      `[Background Task] Successfully upserted ${convertedCards.length} cards to local DB`
    );
  } catch (error) {
    console.error("[Background Task] Error updating local database:", error);
    throw error;
  }
}

// Update local SQLite database with sets
async function updateLocalSetsDatabase(sets: any[]): Promise<void> {
  try {
    await upsertSets(sets);
    console.log(
      `[Background Task] Successfully upserted ${sets.length} sets to local DB`
    );
  } catch (error) {
    // Check if error is about missing 'id' column
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("no column named id") ||
      errorMessage.includes("table sets has no column named id")
    ) {
      console.log(
        "⚠️ Sets table missing 'id' column. Fixing schema and retrying..."
      );
      try {
        // First, reset the schema outside of any transaction
        await resetSetsTable();
        // Then retry the upsert with the fixed schema
        await upsertSets(sets);
        console.log(
          `[Background Task] Successfully upserted ${sets.length} sets to local DB after schema fix`
        );
      } catch (retryError) {
        console.error("[Background Task] Error after schema fix:", retryError);
        throw retryError;
      }
    } else {
      console.error(
        "[Background Task] Error updating local sets database:",
        error
      );
      throw error;
    }
  }
}

// Register the background sync task
export async function registerBackgroundSync() {
  try {
    // Check if already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: SYNC_INTERVAL,
        stopOnTerminate: false, // Continue after closing the app
        startOnBoot: true, // Start when device boots
      });
      console.log("✅ Background sync registered");
    } else {
      console.log("ℹ️ Background sync already registered");
    }
  } catch (error) {
    console.error("❌ Error registering background sync:", error);
    throw error;
  }
}

// Unregister the task (useful for testing)
export async function unregisterBackgroundSync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log("🗑️ Background sync unregistered");
  } catch (error) {
    console.error("❌ Error unregistering:", error);
    throw error;
  }
}

// Check background sync status
export async function checkBackgroundSyncStatus() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );

    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr) : null;

    return {
      status,
      isRegistered,
      statusText: status !== null ? getStatusText(status) : "Unknown",
      lastSync: lastSync ? new Date(lastSync).toISOString() : "Never",
    };
  } catch (error) {
    console.error("Error checking status:", error);
    return null;
  }
}

function getStatusText(status: number): string {
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return "Restricted (iOS)";
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return "Denied by user";
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return "Available";
    default:
      return "Unknown";
  }
}

// Force manual sync (useful for testing and user-initiated sync)
export async function manualSync(): Promise<{
  success: boolean;
  cardsUpdated?: number;
  setsUpdated?: number;
  error?: string;
}> {
  try {
    console.log("🔄 Starting manual sync...");

    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;

    // Fetch cards and sets from Supabase
    const [cards, sets] = await Promise.all([
      fetchCardsFromSupabase(lastSync),
      fetchSetsFromSupabase(lastSync),
    ]);

    if ((!cards || cards.length === 0) && (!sets || sets.length === 0)) {
      console.log("✅ No new data to sync");
      return { success: true, cardsUpdated: 0, setsUpdated: 0 };
    }

    // Update local database with individual try/catch for better error isolation
    let cardsUpdated = 0;
    let setsUpdated = 0;

    if (cards && cards.length > 0) {
      try {
        await updateLocalDatabase(cards);
        cardsUpdated = cards.length;
      } catch (cardError) {
        console.error("❌ Error updating cards:", cardError);
        throw new Error(
          `Failed to update cards: ${
            cardError instanceof Error ? cardError.message : "Unknown error"
          }`
        );
      }
    }

    if (sets && sets.length > 0) {
      try {
        await updateLocalSetsDatabase(sets);
        setsUpdated = sets.length;
      } catch (setError) {
        console.error("❌ Error updating sets:", setError);
        throw new Error(
          `Failed to update sets: ${
            setError instanceof Error ? setError.message : "Unknown error"
          }`
        );
      }
    }

    // Save sync timestamp only after successful completion
    const now = Date.now();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());

    console.log(
      `✅ Manual sync completed! Updated ${cardsUpdated} cards and ${setsUpdated} sets`
    );
    return {
      success: true,
      cardsUpdated,
      setsUpdated,
    };
  } catch (error) {
    console.error("❌ Error in manual sync:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get last sync timestamp
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return lastSyncStr ? new Date(parseInt(lastSyncStr)) : null;
  } catch (error) {
    console.error("Error getting last sync time:", error);
    return null;
  }
}

// Reset sync history (useful for forcing a full sync)
export async function resetSyncHistory() {
  try {
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
    console.log("🔄 Sync history reset");
  } catch (error) {
    console.error("❌ Error resetting sync history:", error);
    throw error;
  }
}
