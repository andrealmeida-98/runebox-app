import { Tabs, useSegments } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function TabLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const backgroundColor = isDark ? "#000000" : "#FFFFFF";
  const borderTopColor = isDark ? "#333333" : "#E0E0E0";
  const inactiveTintColor = isDark ? "#888888" : "#666666";
  const insets = useSafeAreaInsets();

  // Get current route to highlight active tab on sub-pages
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] as string;

  // Map sub-pages to their parent tabs
  const getParentTab = (route: string): string | null => {
    const routeMap: Record<string, string> = {
      "collection-detail": "collection",
      "add-card-to-collection": "collection",
      "deck-detail": "decks",
      "set-detail": "search",
    };
    return routeMap[route] || null;
  };

  const parentTab = getParentTab(currentRoute);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        tabBarInactiveTintColor: inactiveTintColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor,
          borderTopWidth: 1,
          borderTopColor,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingBottom: Platform.OS === "android" ? insets.bottom : 5,
          paddingTop: 5,
          height: Platform.OS === "android" ? 60 + insets.bottom : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="collection"
        options={{
          title: "Collection",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="cards-outline"
              size={24}
              color={parentTab === "collection" ? Colors[theme].tint : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="search"
              size={24}
              color={parentTab === "search" ? Colors[theme].tint : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: "Decks",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="bookmark-box-multiple"
              size={24}
              color={parentTab === "decks" ? Colors[theme].tint : color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => (
            <Feather name="camera" size={24} color={color} />
          ),
        }}
      />

      {/* Detail pages - Hidden from tab bar but keep bottom navigation visible */}
      <Tabs.Screen
        name="collection-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="card-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="set-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="deck-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-card-to-collection"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
