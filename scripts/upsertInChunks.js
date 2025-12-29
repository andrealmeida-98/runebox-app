export async function upsertInChunks(
  supabase,
  table,
  rows,
  { onConflict, chunkSize = 500 }
) {
  if (!rows?.length) return;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const { error } = await supabase.from(table).upsert(chunk, { onConflict });

    if (error) {
      console.error(`❌ Chunk ${i}-${i + chunk.length}`, error);
      throw error;
    }

    console.log(
      `✅ ${Math.min(i + chunk.length, rows.length)} / ${rows.length}`
    );
  }
}
