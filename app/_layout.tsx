import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { Notification } from "@/components/notification";
import {
  NotificationProvider,
  useNotification,
} from "@/contexts/notification-context";
import { ThemeProvider, useTheme } from "@/contexts/theme-context";

function RootLayoutNav() {
  const { theme, isLoading } = useTheme();
  const { notification, hideNotification } = useNotification();

  if (isLoading) {
    return null;
  }

  const isDark = theme === "dark";
  const backgroundColor = isDark ? "#000000" : "#FFFFFF";

  return (
    <>
      {/* Global Notification */}
      <Notification
        visible={notification.visible}
        message={notification.message}
        severity={notification.severity}
        onDismiss={hideNotification}
      />

      <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavigationThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <RootLayoutNav />
      </NotificationProvider>
    </ThemeProvider>
  );
}
