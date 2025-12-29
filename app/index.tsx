import { initDb } from "@/db/initDb";
import {
  checkBackgroundSyncStatus,
  registerBackgroundSync,
} from "@/db/syncBackgroundTask";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export const TASK_NAME = "UPDATE_DATABASE_TASK";

export default function Index() {
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const checkStatus = async () => {
    const status = await checkBackgroundSyncStatus();
    setSyncStatus(status);
  };

  useEffect(() => {
    // Initialize background sync when app starts
    const initializeBackgroundSync = async () => {
      try {
        console.log("🔄 Initializing background sync...");
        await registerBackgroundSync();
        console.log("✅ Background sync initialization complete");
        
        // Check and log the status after registration
        await checkStatus();
      } catch (error) {
        console.error("❌ Failed to initialize background sync:", error);
      }
    };

    initializeBackgroundSync();
  }, []);

  useEffect(() => {
    console.log("Useffect mounted, initializing database.");
    initDb().catch(console.error);
    // setInterval(updateDatabase, 1000);
  }, []);

  return <Redirect href="/(tabs)" />;
}
