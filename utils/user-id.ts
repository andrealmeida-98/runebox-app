import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "@runebox_user_id";

/**
 * Generates a unique user ID
 * Format: timestamp-random string (e.g., 1702876543210-a3f9d2e1b8c4)
 */
export function generateUserId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}${randomPart2}`;
}

/**
 * Gets the user ID from storage, or generates and saves a new one if it doesn't exist
 */
export async function getUserId(): Promise<string> {
  try {
    // Try to get existing user ID
    const existingId = await AsyncStorage.getItem(USER_ID_KEY);

    if (existingId) {
      return existingId;
    }

    // Generate new ID if none exists
    const newId = generateUserId();
    await AsyncStorage.setItem(USER_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error("Error getting user ID:", error);
    // Fallback: return a generated ID without storage
    return generateUserId();
  }
}

/**
 * Resets the user ID (useful for testing or debugging)
 */
export async function resetUserId(): Promise<string> {
  try {
    const newId = generateUserId();
    await AsyncStorage.setItem(USER_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error("Error resetting user ID:", error);
    return generateUserId();
  }
}

/**
 * Clears the user ID from storage
 */
export async function clearUserId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch (error) {
    console.error("Error clearing user ID:", error);
  }
}
