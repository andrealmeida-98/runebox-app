import { Set } from "@/interfaces/set";
import { db } from "../database";

export async function getSets(): Promise<Set[]> {
  const sets = await db.getAllAsync<any>(
    `
        SELECT *
        FROM sets
        ORDER BY created_at DESC
        `
  );

  return sets.map((s) => ({
    id: s.id,
    setName: s.set_name,
    setAbv: s.set_abv,
    createdAt: s.created_at,
  }));
}

export async function upsertSet(set: any) {
  // Handle createdAt - it might be a number (milliseconds) or a Date object
  let createdAt: number;
  if (typeof set.createdAt === "number") {
    createdAt = set.createdAt;
  } else if (set.createdAt instanceof Date) {
    createdAt = set.createdAt.getTime();
  } else if (typeof set.createdAt === "string") {
    createdAt = new Date(set.createdAt).getTime();
  } else {
    createdAt = Date.now();
  }

  return db.runAsync(
    `
        INSERT INTO sets (id, set_name, set_abv, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          set_name = excluded.set_name,
          set_abv = excluded.set_abv,
          created_at = excluded.created_at
        `,
    [
      String(set.id), // Ensure it's a string (UUID from Supabase converted to TEXT)
      String(set.setName),
      String(set.setAbv),
      createdAt,
    ]
  );
}

export async function upsertSets(sets: any[]) {
  return db.withTransactionAsync(async () => {
    for (const set of sets) {
      await upsertSet(set);
    }
  });
}
