import { Button } from "@/components/button";
import { useTheme } from "@/contexts/theme-context";
import {
  checkBackgroundSyncStatus,
  getLastSyncTime,
  manualSync,
} from "@/db/syncBackgroundTask";
import { getThemeColors } from "@/utils/theme-utils";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { theme, toggleTheme } = useTheme();
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

  const {
    backgroundColor,
    cardBackground,
    inputBackground,
    textColor,
    secondaryTextColor,
    borderColor,
  } = getThemeColors(theme);
  const isDark = theme === "dark";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Database Sync
        </Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={24}
            color={textColor}
          />
        </TouchableOpacity>
      </View>

      {/* Sync Status Card */}
      <View
        style={[
          styles.syncCard,
          { backgroundColor: cardBackground, borderColor, borderWidth: 1 },
        ]}
      >
        <View style={styles.syncHeader}>
          <View style={styles.syncTitleContainer}>
            <Ionicons
              name="cloud-done-outline"
              size={24}
              color={getSyncStatusColor()}
            />
            <Text style={[styles.syncTitle, { color: textColor }]}>
              Sync Status
            </Text>
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
            <Ionicons
              name="time-outline"
              size={20}
              color={isDark ? "#666" : "#999"}
            />
            <View style={styles.infoTextContainer}>
              <Text
                style={[styles.infoLabel, { color: isDark ? "#666" : "#999" }]}
              >
                Last Sync
              </Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {getTimeSinceLastSync()}
              </Text>
              {lastSync && (
                <Text
                  style={[
                    styles.infoSubtext,
                    { color: isDark ? "#666" : "#999" },
                  ]}
                >
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
              <Text
                style={[styles.infoLabel, { color: isDark ? "#666" : "#999" }]}
              >
                Background Sync
              </Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {syncStatus?.isRegistered ? "Active" : "Inactive"}
              </Text>
              <Text
                style={[
                  styles.infoSubtext,
                  { color: isDark ? "#666" : "#999" },
                ]}
              >
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
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#666" : "#999" },
                  ]}
                >
                  Last Sync Result
                </Text>
                <Text style={[styles.infoValue, { color: textColor }]}>
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
        <Button
          variant="primary"
          size="large"
          icon="refresh"
          onPress={handleManualSync}
          disabled={syncing}
          loading={syncing}
          fullWidth
          style={styles.syncButton}
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  themeToggle: {
    padding: 8,
  },
  syncCard: {
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
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 12,
  },
  syncButton: {
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
