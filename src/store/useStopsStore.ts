import { create } from "zustand";

import { Stop } from "../domain/entities/Stop";
import { FavoriteStopRepository } from "../data/repositories/FavoriteStopRepository";
import { container } from "../di/container";

interface StopsState {
  stops: Stop[];
  selectedStop: Stop | null;
  favoriteStopIds: number[];
  isLoading: boolean;
  error: string | null;

  setStops: (stops: Stop[]) => void;
  selectStop: (stop: Stop | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  syncStops: () => Promise<void>;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (stopId: number) => Promise<void>;
}

const favoriteRepository = new FavoriteStopRepository();

// Kolejki zapisów – osobna dla każdego przystanku.
const favoriteWriteQueues = new Map<number, Promise<void>>();

// Ostatni stan ulubionych faktycznie zapisany w SQLite.
const persistedFavoriteState = new Map<number, boolean>();

// Numer najnowszej operacji dla danego przystanku.
const favoriteOperationVersions = new Map<number, number>();

function updateFavoriteState(
  set: (
    partial: Partial<StopsState> | ((state: StopsState) => Partial<StopsState>),
  ) => void,
  stopId: number,
  isFavorite: boolean,
) {
  set((state) => {
    const alreadyFavorite = state.favoriteStopIds.includes(stopId);

    if (alreadyFavorite === isFavorite) {
      return {};
    }

    return {
      favoriteStopIds: isFavorite
        ? [...state.favoriteStopIds, stopId]
        : state.favoriteStopIds.filter((id) => id !== stopId),
    };
  });
}

export const useStopsStore = create<StopsState>((set, get) => ({
  stops: [],
  selectedStop: null,
  favoriteStopIds: [],
  isLoading: false,
  error: null,

  setStops: (stops) => set({ stops }),

  selectStop: (stop) => set({ selectedStop: stop }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  syncStops: async () => {
    set({ isLoading: true, error: null });

    try {
      const stops = await container.syncStops.execute();
      set({ stops });
    } catch {
      set({
        error: "Nie udało się pobrać przystanków z ZTM.",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadFavorites: async () => {
    try {
      const favoriteStopIds = await favoriteRepository.getAll();

      // Uzupełnienie informacji o stanie zapisanym w SQLite.
      for (const stop of get().stops) {
        if (!persistedFavoriteState.has(stop.stopId)) {
          persistedFavoriteState.set(
            stop.stopId,
            favoriteStopIds.includes(stop.stopId),
          );
        }
      }

      for (const stopId of favoriteStopIds) {
        persistedFavoriteState.set(stopId, true);
      }

      set({ favoriteStopIds });
    } catch {
      set({
        error: "Nie udało się pobrać ulubionych przystanków.",
      });
    }
  },

  toggleFavorite: async (stopId) => {
    const isFavorite = get().favoriteStopIds.includes(stopId);
    const desiredState = !isFavorite;

    // Jeśli nie ma aktywnego zapisu, aktualny stan jest punktem wyjścia.
    const previousQueue = favoriteWriteQueues.get(stopId);

    if (!previousQueue) {
      persistedFavoriteState.set(stopId, isFavorite);
    }
    // Każda nowa operacja otrzymuje wyższy numer.
    const operationVersion = (favoriteOperationVersions.get(stopId) ?? 0) + 1;

    favoriteOperationVersions.set(stopId, operationVersion);

    // Natychmiastowa aktualizacja interfejsu.
    updateFavoriteState(set, stopId, desiredState);
    set({ error: null });

    // Poczekaj na poprzedni zapis dla tego przystanku.
    const queue = previousQueue ?? Promise.resolve();

    // Zapis zostanie wykonany dopiero po zakończeniu poprzedniego.
    const writePromise = queue.then(async () => {
      try {
        if (desiredState) {
          await favoriteRepository.add(stopId);
        } else {
          await favoriteRepository.remove(stopId);
        }

        // Aktualizacja ostatniego poprawnie zapisanego stanu.
        persistedFavoriteState.set(stopId, desiredState);
      } catch {
        // Starsza operacja nie może cofnąć nowszej zmiany.
        const isLatestOperation =
          favoriteOperationVersions.get(stopId) === operationVersion;

        if (isLatestOperation) {
          const lastPersistedState =
            persistedFavoriteState.get(stopId) ?? false;

          updateFavoriteState(set, stopId, lastPersistedState);

          set({
            error: "Nie udało się zapisać zmian w ulubionych.",
          });
        }
      }
    });

    favoriteWriteQueues.set(stopId, writePromise);

    await writePromise;
    // Usuń zakończoną kolejkę, jeśli nie zastąpiła jej nowsza operacja.
    if (favoriteWriteQueues.get(stopId) === writePromise) {
      favoriteWriteQueues.delete(stopId);
    }
  },
}));
