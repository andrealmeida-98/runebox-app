import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export const syncCards = async () => {
  try {
    const { data, error } = await supabase.from("cards").select("*");
    if (error) {
      console.error("Error fetching cards from Supabase:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Failed to sync cards:", error);
    throw error;
  }
};

export const syncCardsByTimestamp = async (lastSync) => {
  try {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .gt("updated_at", lastSync);

    if (error) {
      console.error("Error fetching updated cards from Supabase:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Failed to sync updated cards:", error);
    throw error;
  }
};
