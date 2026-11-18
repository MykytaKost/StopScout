import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Stop } from "../../src/domain/entities/Stop";
import { Departure } from "../../src/domain/entities/Departure";
import { DepartureCard } from "../../src/components/DepartureCard";
import { container } from "../../src/di/container";
import { useStopsStore } from "../../src/store/useStopsStore";

type StopFilter = "all" | "favorites";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [stopFilter, setStopFilter] = useState<StopFilter>("all");

  useEffect(() => {
    syncStops();
    loadFavorites();
  }, [syncStops, loadFavorites]);

  const selectedStopId = selectedStop?.stopId;

  useEffect(() => {
    let isActive = true;

    const loadDepartures = async () => {
      if (!selectedStopId) {
        setDepartures([]);
        setDeparturesError(null);
        return;
      }

      setIsLoadingDepartures(true);
      setDeparturesError(null);

      try {
        const result =
          await container.getLiveDepartures.execute(selectedStopId);

        if (isActive) {
          setDepartures(result);
        }
      } catch (error) {
        if (isActive) {
          setDepartures([]);
          setDeparturesError(
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać odjazdów.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingDepartures(false);
        }
      }
    };

    loadDepartures();

    return () => {
      isActive = false;
    };
  }, [selectedStopId]);

  const filteredStops = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return stops.filter((stop) => {
      const matchesFilter =
        stopFilter === "all" || favoriteStopIds.includes(stop.stopId);

      const matchesSearch =
        query.length === 0 ||
        stop.stopName.toLowerCase().includes(query) ||
        String(stop.stopId).includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [stops, favoriteStopIds, stopFilter, searchQuery]);

  const renderStop = ({ item }: { item: Stop }) => {
    const isFavorite = favoriteStopIds.includes(item.stopId);
    const isSelected = selectedStop?.stopId === item.stopId;

    return (
      <TouchableOpacity
        style={[styles.stopCard, isSelected && styles.selectedStopCard]}
        onPress={() => selectStop(item)}
        activeOpacity={0.7}
      >
        <View style={styles.stopInfo}>
          <Text style={styles.stopName}>{item.stopName}</Text>

          <Text style={styles.stopId}>ID przystanku: {item.stopId}</Text>

          {isSelected && (
            <Text style={styles.selectedLabel}>Wybrany przystanek</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.stopId)}
          activeOpacity={0.6}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.appTitle}>STOP SCOUT</Text>
        <Text style={styles.subtitle}>Transport w Gdańsku</Text>
      </View>

      {isLoadingStops && stops.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Pobieranie przystanków...</Text>
        </View>
      ) : (
        <>
          {stopsError && <Text style={styles.errorText}>{stopsError}</Text>}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Przystanki ZTM Gdańsk</Text>

            <Text style={styles.totalCount}>Łącznie: {stops.length}</Text>
          </View>

          <View style={styles.filterContainer}>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  stopFilter === "all" && styles.activeFilterButton,
                ]}
                onPress={() => setStopFilter("all")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    stopFilter === "all" && styles.activeFilterButtonText,
                  ]}
                >
                  Wszystkie ({stops.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  stopFilter === "favorites" && styles.activeFilterButton,
                ]}
                onPress={() => setStopFilter("favorites")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    stopFilter === "favorites" && styles.activeFilterButtonText,
                  ]}
                >
                  ★ Ulubione ({favoriteStopIds.length})
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Szukaj przystanku lub ID..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />

            <Text style={styles.filteredCount}>
              Wyświetlono {filteredStops.length} z {stops.length} przystanków
            </Text>
          </View>

          <FlatList
            data={filteredStops}
            keyExtractor={(item) => String(item.stopId)}
            renderItem={renderStop}
            contentContainerStyle={styles.list}
            style={styles.stopsList}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  {stopFilter === "favorites"
                    ? "Nie masz jeszcze ulubionych przystanków."
                    : "Nie znaleziono przystanków."}
                </Text>
              </View>
            }
          />

          {selectedStop && (
            <View style={styles.departuresSection}>
              <Text style={styles.departuresTitle}>
                Odjazdy: {selectedStop.stopName}
              </Text>

              {isLoadingDepartures ? (
                <ActivityIndicator size="small" color="#1D4ED8" />
              ) : departuresError ? (
                <Text style={styles.errorText}>{departuresError}</Text>
              ) : departures.length > 0 ? (
                <FlatList
                  data={departures}
                  keyExtractor={(item, index) =>
                    `${selectedStop.stopId}-${index}`
                  }
                  renderItem={({ item }) => <DepartureCard departure={item} />}
                  style={styles.departuresList}
                  contentContainerStyle={styles.departuresListContent}
                  nestedScrollEnabled
                />
              ) : (
                <Text style={styles.emptyDepartures}>
                  Brak dostępnych odjazdów.
                </Text>
              )}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  appTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 3,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  totalCount: {
    fontSize: 12,
    color: "#6B7280",
  },

  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },

  filterButtons: {
    flexDirection: "row",
    gap: 10,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  activeFilterButton: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },

  filterButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },

  activeFilterButtonText: {
    color: "#FFFFFF",
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
  },

  filteredCount: {
    fontSize: 12,
    color: "#6B7280",
  },

  stopsList: {
    flex: 1,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },

  stopCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  selectedStopCard: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EFF6FF",
  },

  stopInfo: {
    flex: 1,
  },

  stopName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  stopId: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  selectedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
    marginTop: 5,
  },

  favoriteButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  favoriteIcon: {
    fontSize: 27,
    color: "#F59E0B",
  },

  emptyList: {
    padding: 24,
    alignItems: "center",
  },

  emptyListText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },

  departuresSection: {
    maxHeight: 260,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  departuresTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  departuresList: {
    flexGrow: 0,
  },

  departuresListContent: {
    paddingBottom: 8,
  },

  emptyDepartures: {
    fontSize: 13,
    color: "#6B7280",
    paddingVertical: 8,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
