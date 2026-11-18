import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Stop } from "../../src/domain/entities/Stop";
import { Departure } from "../../src/domain/entities/Departure";
import { DepartureCard } from "../../src/components/DepartureCard";
import { MAP_HTML } from "../../src/infrastructure/map/mapHtml";
import { GeoBoundingBox } from "../../src/domain/value-objects/GeoBoundingBox";
import { container } from "../../src/di/container";
import { useStopsStore } from "../../src/store/useStopsStore";
import { useAuthStore } from "../../src/store/useAuthStore";

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

type SelectStopMessage = {
  type: "SELECT_STOP";
  stopId: number;
};

type MapMessage = MapBoundsMessage | AddFavoriteMessage | SelectStopMessage;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView<{}>>(null);
  const requestIdRef = useRef(0);
  const syncStartedRef = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [selectedMapStop, setSelectedMapStop] = useState<Stop | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [departuresError, setDeparturesError] = useState<string | null>(null);

  const stops = useStopsStore((state) => state.stops);
  const isLoading = useStopsStore((state) => state.isLoading);
  const syncStops = useStopsStore((state) => state.syncStops);
  const loadFavorites = useStopsStore((state) => state.loadFavorites);
  const toggleFavorite = useStopsStore((state) => state.toggleFavorite);
  const favoriteStopIds = useStopsStore((state) => state.favoriteStopIds);

  const userId = useAuthStore((state) => state.user?.id ?? null);

  // Załaduj ulubione przystanki zalogowanego użytkownika.
  useEffect(() => {
    void loadFavorites(userId);
  }, [loadFavorites, userId]);

  // Synchronizacja ulubionych przystanków z mapą Leaflet.
  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    webViewRef.current?.injectJavaScript(
      `window.updateFavoriteStops && window.updateFavoriteStops(${JSON.stringify(
        favoriteStopIds,
      )}); true;`,
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

  // Pobieranie i automatyczne odświeżanie odjazdów co 30 sekund.
  useEffect(() => {
    let isActive = true;
    let isFetching = false;
    let hasLoadedOnce = false;

    const loadDepartures = async () => {
      if (!selectedMapStop || isFetching) {
        return;
      }

      isFetching = true;

      if (!hasLoadedOnce) {
        setIsLoadingDepartures(true);
      }

      setDeparturesError(null);

      try {
        const result = await container.getLiveDepartures.execute(
          selectedMapStop.stopId,
        );

        if (isActive) {
          setDepartures(result);
        }
      } catch (error) {
        if (isActive) {
          setDeparturesError(
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać odjazdów.",
          );
        }
      } finally {
        isFetching = false;
        hasLoadedOnce = true;

        if (isActive) {
          setIsLoadingDepartures(false);
        }
      }
    };

    if (!selectedMapStop) {
      setDepartures([]);
      setDeparturesError(null);
      setIsLoadingDepartures(false);
      return;
    }

    // Pierwsze pobranie od razu po wybraniu przystanku.
    setDepartures([]);
    setDeparturesError(null);
    void loadDepartures();

    // Kolejne pobrania co 30 sekund.
    const intervalId = setInterval(() => {
      void loadDepartures();
    }, 30_000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [selectedMapStop]);

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
        `window.updateUserLocation && window.updateUserLocation(...${JSON.stringify(
          locationData,
        )}); true;`,
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

        // Wybór przystanku na mapie.
        if (message.type === "SELECT_STOP") {
          if (
            typeof message.stopId !== "number" ||
            !Number.isFinite(message.stopId) ||
            !Number.isInteger(message.stopId)
          ) {
            return;
          }

          const stop = stops.find((item) => item.stopId === message.stopId);

          if (stop) {
            setSelectedMapStop(stop);
          }

          return;
        }

        // Dodawanie przystanku do ulubionych zalogowanego użytkownika.
        if (message.type === "ADD_FAVORITE") {
          if (
            typeof message.stopId !== "number" ||
            !Number.isFinite(message.stopId) ||
            !Number.isInteger(message.stopId)
          ) {
            return;
          }

          if (userId === null) {
            return;
          }

          await toggleFavorite(userId, message.stopId);
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
    [toggleFavorite, stops, userId],
  );

  const handleCloseDepartures = useCallback(() => {
    setSelectedMapStop(null);
  }, []);

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

      {selectedMapStop && (
        <View
          style={[
            styles.departuresPanel,
            { bottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleContainer}>
              <Text style={styles.panelTitle} numberOfLines={2}>
                {selectedMapStop.stopName}
              </Text>
              <Text style={styles.panelSubtitle}>
                ID przystanku: {selectedMapStop.stopId}
              </Text>
            </View>

            <Pressable
              onPress={handleCloseDepartures}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Zamknij odjazdy"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.departuresContent}>
            {isLoadingDepartures && departures.length === 0 ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color="#1D4ED8" />
                <Text style={styles.statusText}>Pobieranie odjazdów...</Text>
              </View>
            ) : departures.length > 0 ? (
              <>
                <FlatList
                  data={departures}
                  keyExtractor={(item, index) =>
                    `${selectedMapStop.stopId}-${item.routeId}-${index}`
                  }
                  renderItem={({ item }) => <DepartureCard departure={item} />}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  contentContainerStyle={styles.departuresListContent}
                />

                {departuresError && (
                  <Text style={styles.errorText}>
                    Nie udało się odświeżyć odjazdów. Wyświetlane są poprzednie
                    dane.
                  </Text>
                )}
              </>
            ) : departuresError ? (
              <Text style={styles.errorText}>{departuresError}</Text>
            ) : (
              <Text style={styles.emptyDepartures}>
                Brak dostępnych odjazdów.
              </Text>
            )}
          </View>
        </View>
      )}
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
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 5,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  departuresPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    maxHeight: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 14,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  panelSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
  departuresContent: {
    flexShrink: 1,
    minHeight: 45,
  },
  departuresListContent: {
    paddingBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  statusText: {
    fontSize: 13,
    color: "#6B7280",
  },
  emptyDepartures: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 18,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    paddingVertical: 12,
  },
});
