import { getUserId } from "@/utils/user-id";
import { useEffect, useState } from "react";

/**
 * Custom hook to get and manage the unique user ID
 * Automatically loads the user ID on mount
 *
 * @returns Object containing userId and loading state
 */
export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      setLoading(true);
      const id = await getUserId();
      setUserId(id);
    } catch (error) {
      console.error("Error loading user ID:", error);
    } finally {
      setLoading(false);
    }
  };

  return { userId, loading, refreshUserId: loadUserId };
}
