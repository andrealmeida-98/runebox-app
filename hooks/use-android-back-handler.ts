import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";

/**
 * Hook to handle Android back button behavior
 * Navigates to a specific route instead of using default behavior
 *
 * @param fallbackRoute - Route to navigate to on back press (for detail pages)
 * @param minimizeOnBack - If true, minimizes app instead of navigating (for parent pages)
 */
export function useAndroidBackHandler(
  fallbackRoute?: string,
  minimizeOnBack?: boolean,
) {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (minimizeOnBack) {
            // Allow default behavior (minimize app)
            return false;
          }

          if (fallbackRoute) {
            router.replace(fallbackRoute as any);
            return true;
          } else if (router.canGoBack()) {
            router.back();
            return true;
          }

          // No fallback and can't go back - allow default behavior
          return false;
        },
      );

      return () => backHandler.remove();
    }, [router, fallbackRoute, minimizeOnBack]),
  );
}
