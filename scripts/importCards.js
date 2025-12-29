import fs from "fs";

function rowToObject(names, row) {
  return names.reduce((acc, key, i) => {
    acc[key] = row[i];
    return acc;
  }, {});
}

export function parseCardsFromJson(path) {
  const raw = fs.readFileSync(path, "utf-8");
  const { names, data } = JSON.parse(raw);

  return data.map((row) => {
    const c = rowToObject(names, row);
    if (c.id === "OGN-288") console.log(c);
    return {
      id: c.id,
      name: c.name,
      set_name: c.set_name,
      set_abv: c.id?.split("-")[0].toUpperCase(),
      image_url: c.image ?? null,
      ability: c.effect ?? null,
      card_type: c.type ?? null,
      rarity: c.rarity?.toLowerCase() ?? null,
      energy: c.cost ? Number(c.cost) : null,
      might: c.might ? Number(c.might) : null,
      tags: Array.isArray(c.tags) ? c.tags : [],
      price: c.price ? Number(c.price) : null,
      price_change: c.delta7dPrice ? Number(c.delta7dPrice) : null,
      updated_at: new Date().toISOString(),
    };
  });
}
