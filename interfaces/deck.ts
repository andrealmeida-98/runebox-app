// Deck interface
export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cardCount: number;
  totalValue: number;
}

// Individual card entries in a deck
export interface DeckEntry {
  id: string;
  deck_id: string; // links to Deck
  card_id: string; // links to Card
  quantity: number;
}
