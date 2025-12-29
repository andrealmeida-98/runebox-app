import { Card } from "@/interfaces/card";

/**
 * Convert Supabase card data to local Card interface format
 * Returns both the Card object and the updated_at timestamp
 */
export function convertSupabaseCardToLocal(supabaseCard: any): {
  card: Card;
  updatedAt: number;
} {
  // Handle tags: Supabase returns TEXT[] array, convert to string[] if needed
  let tags: string[] = [];
  if (Array.isArray(supabaseCard.tags)) {
    tags = supabaseCard.tags;
  } else if (typeof supabaseCard.tags === "string") {
    try {
      // Try parsing if it's a JSON string
      tags = JSON.parse(supabaseCard.tags);
    } catch {
      // If parsing fails, treat as empty array
      tags = [];
    }
  }

  // Handle price: Supabase uses numeric (can be null), local expects number (defaults to 0)
  const price = supabaseCard.price != null ? Number(supabaseCard.price) : 0;
  const priceChange =
    supabaseCard.price_change != null
      ? Number(supabaseCard.price_change)
      : undefined;

  // Convert timestamps: Supabase uses timestamptz, convert to milliseconds
  const updatedAt = convertSupabaseTimestampToLocal(
    supabaseCard.updated_at || supabaseCard.created_at
  );

  const card: Card = {
    id: String(supabaseCard.id), // Ensure it's a string
    set_name: String(supabaseCard.set_name),
    set_abv: String(supabaseCard.set_abv),
    image_url: supabaseCard.image_url || undefined,
    name: String(supabaseCard.name),
    card_type: String(supabaseCard.card_type) as Card["card_type"],
    rarity: String(supabaseCard.rarity) as Card["rarity"],
    domain: supabaseCard.domain || undefined,
    energy: supabaseCard.energy != null ? Number(supabaseCard.energy) : undefined,
    might: supabaseCard.might != null ? Number(supabaseCard.might) : undefined,
    power: supabaseCard.power != null ? Number(supabaseCard.power) : undefined,
    tags: tags,
    ability: supabaseCard.ability || undefined,
    price: price,
    price_change: priceChange,
  };

  return { card, updatedAt };
}

/**
 * Convert Supabase set data to local Set format
 */
export function convertSupabaseSetToLocal(supabaseSet: any): {
  id: string;
  setName: string;
  setAbv: string;
  createdAt: number;
} {
  // Convert UUID to string (local uses TEXT)
  const id = String(supabaseSet.id);

  // Convert timestamptz to milliseconds (local uses INTEGER)
  let createdAt: number;
  if (supabaseSet.created_at) {
    if (typeof supabaseSet.created_at === "string") {
      createdAt = new Date(supabaseSet.created_at).getTime();
    } else if (supabaseSet.created_at instanceof Date) {
      createdAt = supabaseSet.created_at.getTime();
    } else {
      createdAt = Date.now();
    }
  } else {
    createdAt = Date.now();
  }

  return {
    id: id,
    setName: String(supabaseSet.set_name),
    setAbv: String(supabaseSet.set_abv),
    createdAt: createdAt,
  };
}

/**
 * Convert Supabase updated_at timestamp to local INTEGER timestamp
 */
export function convertSupabaseTimestampToLocal(
  timestamp: string | Date | null | undefined
): number {
  if (!timestamp) {
    return Date.now();
  }

  if (typeof timestamp === "string") {
    return new Date(timestamp).getTime();
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  return Date.now();
}

