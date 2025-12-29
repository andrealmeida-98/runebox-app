import {
  Card,
  CardCollection,
  CardRarity,
  CardType,
  CollectionColor,
  CollectionEntry,
  CollectionIcon,
  Deck,
  DeckEntry,
} from "@/interfaces/card";

// Global cards database (all available cards)
export const GLOBAL_CARDS: Card[] = [
  {
    id: "RB-001",
    name: "Flame Dragon",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    image_url: "https://example.com/flame-dragon.jpg",
    card_type: CardType.SPELL,
    rarity: CardRarity.RARE,
    domain: "Fire",
    energy: 5,
    might: 8,
    power: 6,
    tags: ["Dragon", "Flying"],
    ability: `[Action] (Play on your turn or in showdowns.)
[Repeat]  (You may pay the additional cost to repeat this spell's effect.)
Give a unit [Assault 2]. (+2  while it's an attacker.)`,
    price: 245.0,
    price_change: 12.5,
  },
  {
    id: "RB-012",
    name: "Mystic Scholar",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.UNCOMMON,
    domain: "Arcane",
    energy: 3,
    might: 2,
    power: 4,
    tags: ["Wizard", "Human"],
    ability: "Draw a card when this creature enters the battlefield",
    price: 45.5,
    price_change: -5.2,
  },
  {
    id: "RB-023",
    name: "Forest Guardian",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.COMMON,
    domain: "Nature",
    energy: 2,
    might: 3,
    power: 5,
    tags: ["Beast", "Guardian"],
    ability: "Regenerate 1 health at the start of your turn",
    price: 12.99,
    price_change: 3.8,
  },
  {
    id: "RB-034",
    name: "Lightning Strike",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.SPELL,
    rarity: CardRarity.COMMON,
    domain: "Storm",
    energy: 4,
    tags: ["Instant", "Damage"],
    ability: "Deal 6 damage to target creature or player",
    price: 8.5,
  },
  {
    id: "RB-045",
    name: "Shadow Assassin",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.EPIC,
    domain: "Darkness",
    energy: 4,
    might: 5,
    power: 3,
    tags: ["Rogue", "Stealth"],
    ability: "Can't be blocked by creatures with power 3 or less",
    price: 310.0,
    price_change: -8.3,
  },
  {
    id: "RB-056",
    name: "Healing Fountain",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.GEAR,
    rarity: CardRarity.UNCOMMON,
    domain: "Light",
    energy: 3,
    tags: ["Artifact", "Healing"],
    ability: "At the start of your turn, gain 2 life",
    price: 22.75,
  },
  {
    id: "RB-067",
    name: "Storm Elemental",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.RARE,
    domain: "Storm",
    energy: 6,
    might: 7,
    power: 5,
    tags: ["Elemental", "Flying"],
    ability: "When this creature attacks, deal 1 damage to all other creatures",
    price: 189.0,
    price_change: 15.7,
  },
  {
    id: "RB-078",
    name: "Crystal Shield",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.SPELL,
    rarity: CardRarity.UNCOMMON,
    domain: "Arcane",
    energy: 2,
    tags: ["Protection", "Instant"],
    ability: "Target creature gains +0/+4 until end of turn",
    price: 15.0,
  },
  {
    id: "RB-089",
    name: "Ancient Golem",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.SHOWCASE,
    domain: "Earth",
    energy: 7,
    might: 10,
    power: 10,
    tags: ["Construct", "Legendary"],
    ability:
      "Indestructible. This creature can't be destroyed by damage or effects",
    price: 520.0,
  },
  {
    id: "RB-100",
    name: "Void Walker",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.UNCOMMON,
    domain: "Darkness",
    energy: 3,
    might: 3,
    power: 3,
    tags: ["Spirit", "Stealth"],
    ability: "Cannot be blocked by non-flying creatures",
    price: 18.5,
  },
  {
    id: "RB-111",
    name: "Fireball",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.SPELL,
    rarity: CardRarity.COMMON,
    domain: "Fire",
    energy: 3,
    tags: ["Instant", "Damage"],
    ability: "Deal 4 damage to target creature or player",
    price: 6.25,
  },
  {
    id: "RB-122",
    name: "Mana Crystal",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.GEAR,
    rarity: CardRarity.RARE,
    domain: "Arcane",
    energy: 2,
    tags: ["Artifact", "Mana"],
    ability: "Reduce the cost of your spells by 1",
    price: 125.0,
  },
  {
    id: "RB-133",
    name: "Battle Axe",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.GEAR,
    rarity: CardRarity.COMMON,
    domain: "Fire",
    energy: 2,
    tags: ["Weapon", "Equipment"],
    ability: "Equipped creature gets +2/+0",
    price: 8.0,
  },
  {
    id: "RB-144",
    name: "Wind Spirit",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.UNCOMMON,
    domain: "Storm",
    energy: 2,
    might: 2,
    power: 2,
    tags: ["Elemental", "Flying"],
    ability: "Flying, Haste",
    price: 12.5,
  },
  {
    id: "RB-200",
    name: "Viktor the Conqueror",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.LEGEND,
    rarity: CardRarity.SHOWCASE,
    domain: "Fire",
    energy: 8,
    might: 12,
    power: 10,
    tags: ["Dragon", "Legendary"],
    ability:
      "[Enter] Deal 5 damage to all enemy units. [Champion Ability]: Gain +3/+3 for each unit destroyed this turn.",
    price: 850.0,
  },
  {
    id: "RB-201",
    name: "Volcanic Plains",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.BATTLEFIELD,
    rarity: CardRarity.RARE,
    domain: "Fire",
    energy: 3,
    tags: ["Terrain", "Fire"],
    ability:
      "All Fire units gain +1/+0. At the start of your turn, deal 1 damage to all non-Fire units.",
    price: 65.0,
  },
  {
    id: "RB-202",
    name: "Rune of Power",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.RUNE,
    rarity: CardRarity.EPIC,
    domain: "Arcane",
    energy: 2,
    tags: ["Enchantment", "Buff"],
    ability:
      "Attach to a unit. Equipped unit gains +2/+2 and [Rune Bearer] (This unit can carry additional runes).",
    price: 95.0,
  },
  {
    id: "RB-203",
    name: "Swamp Scout",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.COMMON,
    domain: "Nature",
    energy: 1,
    might: 1,
    power: 2,
    tags: ["Scout", "Beast"],
    ability:
      "[Deploy] (You may play this from anywhere). [Stealth] until end of turn.",
    price: 5.0,
  },
  {
    id: "RB-204",
    name: "Fire Breather",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.UNCOMMON,
    domain: "Fire",
    energy: 4,
    might: 4,
    power: 3,
    tags: ["Dragon", "Fire"],
    ability:
      "[Action]: Deal 2 damage to target unit or player. Activate only once per turn.",
    price: 18.0,
  },
  {
    id: "RB-205",
    name: "Crimson Hatchling",
    set_name: "Riftbound Chronicles",
    set_abv: "RBC",
    card_type: CardType.UNIT,
    rarity: CardRarity.COMMON,
    domain: "Fire",
    energy: 2,
    might: 2,
    power: 1,
    tags: ["Dragon"],
    ability:
      "[Flying]. When this unit dies, deal 2 damage to a random enemy unit.",
    price: 8.0,
  },
];

// User's collection entries (links cards to collections)
export const USER_COLLECTION_ENTRIES: CollectionEntry[] = [
  // Rare Holos collection (id: "1")
  {
    id: "col-001",
    collection_id: "1",
    card_id: "RB-001",
    quantity: 1,
  },
  {
    id: "col-005",
    collection_id: "1",
    card_id: "RB-045",
    quantity: 1,
  },
  {
    id: "col-009",
    collection_id: "1",
    card_id: "RB-089",
    quantity: 1,
  },

  // Standard Deck collection (id: "2")
  {
    id: "col-002",
    collection_id: "2",
    card_id: "RB-012",
    quantity: 4,
  },
  {
    id: "col-003",
    collection_id: "2",
    card_id: "RB-023",
    quantity: 2,
  },
  {
    id: "col-007",
    collection_id: "2",
    card_id: "RB-067",
    quantity: 2,
  },

  // Trade Binder collection (id: "3")
  {
    id: "col-004",
    collection_id: "3",
    card_id: "RB-034",
    quantity: 4,
  },
  {
    id: "col-006",
    collection_id: "3",
    card_id: "RB-056",
    quantity: 2,
  },
  {
    id: "col-008",
    collection_id: "3",
    card_id: "RB-078",
    quantity: 3,
  },
  {
    id: "col-010",
    collection_id: "3",
    card_id: "RB-100",
    quantity: 2,
  },
  {
    id: "col-011",
    collection_id: "3",
    card_id: "RB-111",
    quantity: 3,
  },
  {
    id: "col-012",
    collection_id: "3",
    card_id: "RB-122",
    quantity: 1,
  },
  {
    id: "col-013",
    collection_id: "3",
    card_id: "RB-133",
    quantity: 4,
  },
  {
    id: "col-014",
    collection_id: "3",
    card_id: "RB-144",
    quantity: 2,
  },
];

export const INITIAL_COLLECTIONS: CardCollection[] = [
  {
    id: "1",
    user_id: "user-123",
    name: "Rare Holos",
    cardCount: 3, // 3 unique cards
    totalValue: 1075, // $245 + $310 + $520
    color: CollectionColor.BLUE,
    icon: CollectionIcon.BOLT,
  },
  {
    id: "2",
    user_id: "user-123",
    name: "Standard Deck",
    cardCount: 3, // 3 unique cards (quantities: 4, 2, 2)
    totalValue: 586, // $182 + $25.98 + $378
    color: CollectionColor.GREEN,
    icon: CollectionIcon.CUBE,
  },
  {
    id: "3",
    user_id: "user-123",
    name: "Trade Binder",
    cardCount: 8, // 8 unique cards (total quantity: 21)
    totalValue: 308, // $34 + $45.50 + $45 + $37 + $18.75 + $125 + $32 + $25
    color: CollectionColor.ORANGE,
    icon: CollectionIcon.DIAMOND,
  },
  {
    id: "4",
    user_id: "user-123",
    name: "Bulk Storage",
    cardCount: 0, // Empty collection
    totalValue: 0,
    color: CollectionColor.RED,
    icon: CollectionIcon.INBOX,
  },
];

// User's decks
export const USER_DECKS: Deck[] = [
  {
    id: "deck-1",
    user_id: "user-123",
    name: "Top Meta Viktor!",
    description: "Main Board",
    background_image: "https://example.com/viktor-bg.jpg",
    cardCount: 56,
    totalValue: 1245.0,
  },
  {
    id: "deck-2",
    user_id: "user-123",
    name: "Storm Control",
    description: "Tournament Ready",
    background_image: "https://example.com/storm-bg.jpg",
    cardCount: 60,
    totalValue: 892.5,
  },
  {
    id: "deck-3",
    user_id: "user-123",
    name: "Budget Aggro",
    description: "For Beginners",
    background_image: "https://example.com/aggro-bg.jpg",
    cardCount: 50,
    totalValue: 156.0,
  },
];

// Deck entries (cards in decks)
export const USER_DECK_ENTRIES: DeckEntry[] = [
  // Top Meta Viktor deck entries
  {
    id: "deck-entry-1",
    deck_id: "deck-1",
    card_id: "RB-200", // Viktor the Conqueror (Legend)
    quantity: 1,
  },
  {
    id: "deck-entry-2",
    deck_id: "deck-1",
    card_id: "RB-203", // Swamp Scout (Unit)
    quantity: 2,
  },
  {
    id: "deck-entry-3",
    deck_id: "deck-1",
    card_id: "RB-204", // Fire Breather (Unit)
    quantity: 4,
  },
  {
    id: "deck-entry-4",
    deck_id: "deck-1",
    card_id: "RB-205", // Crimson Hatchling (Unit)
    quantity: 3,
  },
  {
    id: "deck-entry-5",
    deck_id: "deck-1",
    card_id: "RB-023", // Forest Guardian (Unit)
    quantity: 3,
  },
  {
    id: "deck-entry-6",
    deck_id: "deck-1",
    card_id: "RB-001", // Flame Dragon (Spell)
    quantity: 2,
  },
  {
    id: "deck-entry-7",
    deck_id: "deck-1",
    card_id: "RB-034", // Lightning Strike (Spell)
    quantity: 3,
  },
  {
    id: "deck-entry-8",
    deck_id: "deck-1",
    card_id: "RB-111", // Fireball (Spell)
    quantity: 4,
  },
  {
    id: "deck-entry-9",
    deck_id: "deck-1",
    card_id: "RB-133", // Battle Axe (Gear)
    quantity: 2,
  },
  {
    id: "deck-entry-10",
    deck_id: "deck-1",
    card_id: "RB-122", // Mana Crystal (Gear)
    quantity: 1,
  },
  {
    id: "deck-entry-11",
    deck_id: "deck-1",
    card_id: "RB-201", // Volcanic Plains (Battlefield)
    quantity: 1,
  },
  {
    id: "deck-entry-12",
    deck_id: "deck-1",
    card_id: "RB-202", // Rune of Power (Rune)
    quantity: 2,
  },
  // Storm Control deck entries
  {
    id: "deck-entry-13",
    deck_id: "deck-2",
    card_id: "RB-067", // Storm Elemental (Unit)
    quantity: 4,
  },
  {
    id: "deck-entry-14",
    deck_id: "deck-2",
    card_id: "RB-144", // Wind Spirit (Unit)
    quantity: 4,
  },
  {
    id: "deck-entry-15",
    deck_id: "deck-2",
    card_id: "RB-078", // Crystal Shield (Spell)
    quantity: 3,
  },
  // Budget Aggro deck entries
  {
    id: "deck-entry-16",
    deck_id: "deck-3",
    card_id: "RB-023", // Forest Guardian (Unit)
    quantity: 4,
  },
  {
    id: "deck-entry-17",
    deck_id: "deck-3",
    card_id: "RB-111", // Fireball (Spell)
    quantity: 4,
  },
];
