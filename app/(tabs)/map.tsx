import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAP_HTML } from "../../src/infrastructure/map/mapHtml";
import { GeoBoundingBox } from "../../src/domain/value-objects/GeoBoundingBox";
import { container } from "../../src/di/container";
import { useStopsStore } from "../../src/store/useStopsStore";

type MapBoundsMessage = {
  type: "MAP_BOUNDS";
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  zoomLevel: number;
};

type AddFavoriteMessage = {
  type: "ADD_FAVORITE";
  stopId: number;
};

type MapMessage = MapBoundsMessage | AddFavoriteMessage;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView<{}>>(null);
  const requestIdRef = useRef(0);
  const syncStartedRef = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const stops = useStopsStore((state) => state.stops);
  const isLoading = useStopsStore((state) => state.isLoading);
  const syncStops = useStopsStore((state) => state.syncStops);
  const loadFavorites = useStopsStore((state) => state.loadFavorites);
  const toggleFavorite = useStopsStore((state) => state.toggleFavorite);
  const favoriteStopIds = useStopsStore(
  (state) => state.favoriteStopIds
);

  // Załaduj zapisane ulubione przystanki.
  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  // Synchronizacja ulubionych przystanków z mapą Leaflet.
  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    webViewRef.current?.injectJavaScript(
      `window.updateFavoriteStops && window.updateFavoriteStops(${JSON.stringify(
        favoriteStopIds
      )}); true;`
    );
  }, [isMapReady, favoriteStopIds]);

  // Pobierz przystanki, jeśli nie zostały jeszcze zsynchronizowane.
  useEffect(() => {
    if (!syncStartedRef.current && stops.length === 0 && !isLoading) {
      syncStartedRef.current = true;
      void syncStops();
    }
  }, [stops.length, isLoading, syncStops]);

  // Po załadowaniu przystanków poproś mapę o aktualny obszar.
  useEffect(() => {
    if (isMapReady && stops.length > 0) {
      webViewRef.current?.injectJavaScript(
        "window.requestBounds && window.requestBounds(); true;",
      );
    }
  }, [isMapReady, stops.length]);

  // Pobieranie aktualnej lokalizacji GPS.
  const handleGetLocation = useCallback(async () => {
    if (!isMapReady || isLocating) {
      return;
    }

    setIsLocating(true);

    try {
      const hasPermission =
        await container.locationService.requestPermissions();

      if (!hasPermission) {
        Alert.alert(
          "Brak dostępu do lokalizacji",
          "Zezwól aplikacji StopScout na dostęp do lokalizacji w ustawieniach telefonu.",
        );
        return;
      }

      const coordinates = await container.locationService.getCurrentPosition();

      if (!coordinates) {
        Alert.alert(
          "Błąd lokalizacji",
          "Nie udało się pobrać aktualnej pozycji. Sprawdź, czy GPS jest włączony.",
        );
        return;
      }

      const locationData = [
        coordinates.latitude,
        coordinates.longitude,
        coordinates.accuracy ?? 0,
      ];

      webViewRef.current?.injectJavaScript(
        `window.updateUserLocation && window.updateUserLocation(...${JSON.stringify(locationData)}); true;`,
      );
    } catch (error) {
      console.error("Błąd pobierania lokalizacji:", error);

      Alert.alert(
        "Błąd",
        "Wystąpił problem podczas pobierania lokalizacji użytkownika.",
      );
    } finally {
      setIsLocating(false);
    }
  }, [isMapReady, isLocating]);

  // Obsługa wiadomości wysyłanych z Leaflet do React Native.
  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const parsed: unknown = JSON.parse(event.nativeEvent.data);

        if (typeof parsed !== "object" || parsed === null) {
          return;
        }

        const message = parsed as MapMessage;

        // Dodawanie przystanku do ulubionych.
        if (message.type === "ADD_FAVORITE") {
          if (
            typeof message.stopId !== "number" ||
            !Number.isFinite(message.stopId) ||
            !Number.isInteger(message.stopId)
          ) {
            return;
          }

          await toggleFavorite(message.stopId);
          return;
        }

        // Obsługa zmian widocznego obszaru mapy.
        if (
          message.type !== "MAP_BOUNDS" ||
          !Number.isFinite(message.minLat) ||
          !Number.isFinite(message.maxLat) ||
          !Number.isFinite(message.minLon) ||
          !Number.isFinite(message.maxLon) ||
          !Number.isFinite(message.zoomLevel)
        ) {
          return;
        }

        const currentRequestId = ++requestIdRef.current;

        const boundingBox = new GeoBoundingBox(
          message.minLat,
          message.maxLat,
          message.minLon,
          message.maxLon,
          message.zoomLevel,
        );

        const visibleStops =
          await container.stopRepository.getInBoundingBox(boundingBox);

        // Ignoruj wyniki starszych zapytań.
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const markers = visibleStops.map((stop) => ({
          id: stop.stopId,
          name: stop.stopName,
          latitude: stop.stopLat,
          longitude: stop.stopLon,
        }));

        webViewRef.current?.injectJavaScript(
          `window.updateStops(${JSON.stringify(markers)}); true;`,
        );
      } catch (error) {
        console.error("Błąd obsługi wiadomości z mapy:", error);
      }
    },
    [toggleFavorite],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <WebView<{}>
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => setIsMapReady(true)}
        onMessage={handleMessage}
        style={styles.map}
      />

      <Pressable
        style={[
          styles.locationButton,
          { top: insets.top + 12 },
          isLocating && styles.locationButtonDisabled,
        ]}
        onPress={handleGetLocation}
        disabled={!isMapReady || isLocating}
        accessibilityRole="button"
        accessibilityLabel="Pokaż moją lokalizację"
      >
        <Text style={styles.locationButtonText}>
          {isLocating ? "Pobieranie..." : "◎ Moja lokalizacja"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: "#FFFFFF",
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: "absolute",
    top: 12,
    right: 15,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 5,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
