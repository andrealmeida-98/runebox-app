import {
  checkBackgroundSyncStatus,
  getLastSyncTime,
  manualSync,
} from "@/db/syncBackgroundTask";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    cardsUpdated?: number;
    setsUpdated?: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSyncInfo = async () => {
    try {
      const lastSyncTime = await getLastSyncTime();
      const status = await checkBackgroundSyncStatus();
      setLastSync(lastSyncTime);
      setSyncStatus(status);
    } catch (error) {
      console.error("Error loading sync info:", error);
    }
  };

  const handleManualSync = useCallback(async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await manualSync();
      setSyncResult(result);
      await loadSyncInfo();
    } catch (error) {
      console.error("Error during manual sync:", error);
      setSyncResult({ success: false });
    } finally {
      setSyncing(false);
    }
  }, []);

  const checkAndAutoSync = useCallback(async () => {
    try {
      const lastSyncTime = await getLastSyncTime();
      const now = new Date();

      // Auto-sync if:
      // 1. Never synced before, OR
      // 2. Last sync was more than 15 minutes ago
      if (
        !lastSyncTime ||
        now.getTime() - lastSyncTime.getTime() > 15 * 60 * 1000
      ) {
        console.log("Auto-syncing because last sync was too old...");
        await handleManualSync();
      }
    } catch (error) {
      console.error("Error in auto-sync check:", error);
    }
  }, [handleManualSync]);

  // Auto-sync on mount and when app comes to foreground
  useEffect(() => {
    loadSyncInfo();

    // Check if we should auto-sync on app open
    checkAndAutoSync();

    // Listen for app state changes (background/foreground)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // App came to foreground, check if we should sync
        checkAndAutoSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkAndAutoSync]);

  const onRefresh = async () => {
    setRefreshing(true);
    await handleManualSync();
    setRefreshing(false);
  };

  const getTimeSinceLastSync = () => {
    if (!lastSync) return "Never";

    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getSyncStatusColor = () => {
    if (syncResult?.success === false) return "#ef4444";
    if (syncStatus?.statusText === "Available" && lastSync) return "#22c55e";
    if (syncStatus?.statusText === "Available") return "#f59e0b";
    return "#666";
  };

  const source = {
    html: `
    "When one of your units becomes [Mighty], you may exhaust me to channel 1 rune exhausted. <i>(A unit is Mighty while it has 5+ :rb_might:.)</i>";
    `,
  };
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Database Sync</Text>
      </View>

      {/* Sync Status Card */}
      <View style={styles.syncCard}>
        <View style={styles.syncHeader}>
          <View style={styles.syncTitleContainer}>
            <Ionicons
              name="cloud-done-outline"
              size={24}
              color={getSyncStatusColor()}
            />
            <Text style={styles.syncTitle}>Sync Status</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getSyncStatusColor() },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {syncStatus?.statusText || "Unknown"}
            </Text>
          </View>
        </View>

        {/* Last Sync Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Last Sync</Text>
              <Text style={styles.infoValue}>{getTimeSinceLastSync()}</Text>
              {lastSync && (
                <Text style={styles.infoSubtext}>
                  {lastSync.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Background Sync Status */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons
              name={
                syncStatus?.isRegistered
                  ? "checkmark-circle-outline"
                  : "alert-circle-outline"
              }
              size={20}
              color={syncStatus?.isRegistered ? "#22c55e" : "#f59e0b"}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Background Sync</Text>
              <Text style={styles.infoValue}>
                {syncStatus?.isRegistered ? "Active" : "Inactive"}
              </Text>
              <Text style={styles.infoSubtext}>
                Runs when app is closed (OS-dependent)
              </Text>
            </View>
          </View>
        </View>

        {/* Last Sync Result */}
        {syncResult && (
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons
                name={
                  syncResult.success
                    ? "checkmark-circle"
                    : "close-circle-outline"
                }
                size={20}
                color={syncResult.success ? "#22c55e" : "#ef4444"}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Last Sync Result</Text>
                <Text style={styles.infoValue}>
                  {syncResult.success
                    ? `Updated ${syncResult.cardsUpdated || 0} cards and ${
                        syncResult.setsUpdated || 0
                      } sets`
                    : "Failed to sync"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Manual Sync Button */}
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.syncButtonText}>Syncing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#0a0a0a",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  syncCard: {
    backgroundColor: "#1a1a1a",
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 20,
  },
  syncHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  syncTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  syncTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 12,
    color: "#666",
  },
  syncButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  syncButtonDisabled: {
    backgroundColor: "#1e3a5f",
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#1a1a1a",
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  infoCardText: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
    lineHeight: 20,
  },
});
