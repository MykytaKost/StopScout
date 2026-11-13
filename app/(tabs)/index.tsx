import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Stop } from "../../src/domain/entities/Stop";
import { Departure } from "../../src/domain/entities/Departure";
import { DepartureCard } from "../../src/components/DepartureCard";
import { fetchDepartures } from "../../src/infrastructure/api/ztmApi";
import { useStopsStore } from "../../src/store/useStopsStore";

export default function DeparturesScreen() {
  const stops = useStopsStore((state) => state.stops);
  const selectedStop = useStopsStore((state) => state.selectedStop);
  const isLoadingStops = useStopsStore((state) => state.isLoading);
  const stopsError = useStopsStore((state) => state.error);

  const favoriteStopIds = useStopsStore((state) => state.favoriteStopIds);

  const syncStops = useStopsStore((state) => state.syncStops);
  const selectStop = useStopsStore((state) => state.selectStop);
  const loadFavorites = useStopsStore((state) => state.loadFavorites);
  const toggleFavorite = useStopsStore((state) => state.toggleFavorite);

  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [departuresError, setDeparturesError] = useState<string | null>(null);

  const selectedStopId = selectedStop?.stopId ?? null;

  useEffect(() => {
    syncStops();
  }, [syncStops]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (selectedStopId === null) {
      setDepartures([]);
      setDeparturesError(null);
      return;
    }

    let cancelled = false;

    const loadDepartures = async () => {
      setIsLoadingDepartures(true);
      setDeparturesError(null);
      setDepartures([]);

      try {
        const result = await fetchDepartures(selectedStopId);

        if (!cancelled) {
          setDepartures(result);
        }
      } catch {
        if (!cancelled) {
          setDeparturesError("Nie udało się pobrać odjazdów z ZTM.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDepartures(false);
        }
      }
    };

    loadDepartures();

    return () => {
      cancelled = true;
    };
  }, [selectedStopId]);

  const renderStop = ({ item }: { item: Stop }) => {
    const isSelected = selectedStop?.stopId === item.stopId;
    const isFavorite = favoriteStopIds.includes(item.stopId);

    return (
      <View style={[styles.stopItem, isSelected && styles.selectedStopItem]}>
        <TouchableOpacity
          style={styles.stopMain}
          onPress={() => selectStop(item)}
          activeOpacity={0.7}
        >
          <View style={styles.stopTextContainer}>
            <Text
              style={[styles.stopName, isSelected && styles.selectedStopName]}
            >
              {item.stopName}
            </Text>

            <Text style={styles.stopId}>ID przystanku: {item.stopId}</Text>
          </View>

          {isSelected && <Text style={styles.selectedLabel}>WYBRANY</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.stopId)}
          activeOpacity={0.6}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.appName}>STOP SCOUT</Text>
        <Text style={styles.subtitle}>Transport w Gdańsku</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Przystanki ZTM Gdańsk</Text>

        <Text style={styles.count}>{stops.length} przystanków</Text>
      </View>

      {isLoadingStops && stops.length === 0 && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Pobieranie przystanków...</Text>
        </View>
      )}

      {stopsError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{stopsError}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={syncStops}>
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </View>
      )}

      {stops.length > 0 && (
        <>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedInfoLabel}>WYBRANY PRZYSTANEK</Text>

            <Text style={styles.selectedInfoName}>
              {selectedStop
                ? selectedStop.stopName
                : "Wybierz przystanek z listy"}
            </Text>
          </View>

          <FlatList
            data={stops}
            keyExtractor={(item) => String(item.stopId)}
            renderItem={renderStop}
            contentContainerStyle={styles.list}
            style={styles.stopsList}
            showsVerticalScrollIndicator={true}
          />

          {selectedStop && (
            <View style={styles.departuresSection}>
              <Text style={styles.departuresTitle}>Najbliższe odjazdy</Text>

              {isLoadingDepartures && (
                <ActivityIndicator size="large" color="#1D4ED8" />
              )}

              {departuresError && (
                <Text style={styles.errorText}>{departuresError}</Text>
              )}

              {!isLoadingDepartures &&
                !departuresError &&
                departures.length === 0 && (
                  <Text style={styles.emptyText}>
                    Brak aktualnych odjazdów.
                  </Text>
                )}

              {departures.map((departure) => (
                <DepartureCard
                  key={String(departure.id)}
                  departure={departure}
                />
              ))}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6FB",
  },
  stopsList: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  appName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1D4ED8",
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  count: {
    fontSize: 12,
    color: "#6B7280",
  },
  selectedInfo: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#1D4ED8",
  },
  selectedInfoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#BFDBFE",
    letterSpacing: 1,
  },
  selectedInfoName: {
    marginTop: 7,
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  stopItem: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedStopItem: {
    borderColor: "#1D4ED8",
    borderWidth: 2,
  },
  stopMain: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stopTextContainer: {
    flex: 1,
  },
  stopName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  selectedStopName: {
    color: "#1D4ED8",
  },
  stopId: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1D4ED8",
    marginLeft: 8,
  },
  favoriteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  favoriteIcon: {
    fontSize: 27,
    color: "#F59E0B",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  errorText: {
    color: "#B91C1C",
  },
  retryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
  departuresSection: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    gap: 12,
  },
  departuresTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
  },
});
