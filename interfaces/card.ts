export enum CardRarity {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  SHOWCASE = "showcase",
}

export enum CollectionColor {
  BLUE = "#3b82f6",
  GREEN = "#22c55e",
  ORANGE = "#f97316",
  RED = "#ef4444",
  PURPLE = "#a855f7",
  CYAN = "#06b6d4",
}

export enum CollectionIcon {
  STAR = "star",
  DIAMOND = "diamond",
  CUBE = "cube",
  INBOX = "inbox",
  BOLT = "bolt",
}

export interface Card {
  id: string;
  set_name: string;
  set_abv: string;
  image_url?: string;
  name: string;
  card_type: CardType;
  rarity: CardRarity;
  domain?: CardDomain[];
  energy?: number;
  might?: number;
  power?: number;
  tags: string[];
  ability?: string;
  price?: number; // Optional - some cards may not have a price yet
  price_foil?: number; // Optional - foil price
  price_change?: number; // Percentage change since last week
}

export enum CardDomain {
  ORDER = "Order",
  CALM = "Calm",
  CHAOS = "Chaos",
  MIND = "Mind",
  BODY = "Body",
}

export enum CardType {
  CHAMPION = "Champion",
  LEGEND = "Legend",
  UNIT = "Unit",
  SPELL = "Spell",
  GEAR = "Gear",
  RUNE = "Rune",
  BATTLEFIELD = "Battlefield",
  TOKEN = "Token",
}

// The collection itself
export interface CardCollection {
  id: string;
  user_id: string;
  name: string;
  totalValue: number;
  cardCount: number;
  color: CollectionColor;
  icon: CollectionIcon;
}

// Individual card entries in a collection
export interface CollectionEntry {
  id: string;
  collection_id: string; // links to CardCollection
  card_id: string; // links to Card
  quantity: number;
}
