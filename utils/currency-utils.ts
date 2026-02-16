import { CurrencyType } from "@/contexts/currency-context";

/**
 * Formats a price with the appropriate currency symbol
 * @param price The price value to format
 * @param currency The currency type (USD or EUR)
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number, currency: CurrencyType): string {
  const symbol = currency === "USD" ? "$" : "€";
  return `${symbol}${price.toFixed(2)}`;
}

/**
 * Gets the currency symbol for a given currency type
 * @param currency The currency type (USD or EUR)
 * @returns The currency symbol
 */
export function getCurrencySymbol(currency: CurrencyType): string {
  return currency === "USD" ? "$" : "€";
}
