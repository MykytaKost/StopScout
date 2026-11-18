import { create } from "zustand";

import { Stop } from "../domain/entities/Stop";
import { FavoriteStopRepository } from "../data/repositories/FavoriteStopRepository";
import { container } from "../di/container";

interface StopsState {
  stops: Stop[];
  selectedStop: Stop | null;
  favoriteStopIds: number[];
  favoriteUserId: number | null;
  isLoading: boolean;
  error: string | null;

  setStops: (stops: Stop[]) => void;
  selectStop: (stop: Stop | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  syncStops: () => Promise<void>;
  loadFavorites: (userId: number | null) => Promise<void>;
  toggleFavorite: (userId: number, stopId: number) => Promise<void>;
}

const favoriteRepository = new FavoriteStopRepository();

// Kolejki zapisów są osobne dla użytkownika i przystanku.
const favoriteWriteQueues = new Map<string, Promise<void>>();

// Ostatni stan ulubionych faktycznie zapisany w SQLite.
const persistedFavoriteState = new Map<string, boolean>();

// Numer najnowszej operacji dla użytkownika i przystanku.
const favoriteOperationVersions = new Map<string, number>();

// Chroni przed zastosowaniem wyników nieaktualnego pobierania.
let favoriteLoadVersion = 0;

function getFavoriteKey(userId: number, stopId: number): string {
  return `${userId}:${stopId}`;
}

function updateFavoriteState(
  set: (
    partial: Partial<StopsState> | ((state: StopsState) => Partial<StopsState>),
  ) => void,
  userId: number,
  stopId: number,
  isFavorite: boolean,
) {
  set((state) => {
    // Nie zmieniaj listy, jeśli aktywne jest już inne konto.
    if (state.favoriteUserId !== userId) {
      return {};
    }

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
  favoriteUserId: null,
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
    } catch (error) {
      console.error("Błąd synchronizacji przystanków:", error);

      set({
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać przystanków z ZTM.",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadFavorites: async (userId) => {
    const loadVersion = ++favoriteLoadVersion;

    if (userId === null) {
      set({
        favoriteUserId: null,
        favoriteStopIds: [],
      });
      return;
    }

    // Natychmiast wyczyść listę poprzedniego konta.
    if (get().favoriteUserId !== userId) {
      set({
        favoriteUserId: userId,
        favoriteStopIds: [],
      });
    }

    try {
      const favoriteStopIds = await favoriteRepository.getAll(userId);

      // Ignoruj wynik, jeśli w międzyczasie zmieniło się konto
      // lub rozpoczęto nowsze pobieranie.
      if (
        loadVersion !== favoriteLoadVersion ||
        get().favoriteUserId !== userId
      ) {
        return;
      }

      for (const stop of get().stops) {
        const key = getFavoriteKey(userId, stop.stopId);

        if (!persistedFavoriteState.has(key)) {
          persistedFavoriteState.set(
            key,
            favoriteStopIds.includes(stop.stopId),
          );
        }
      }

      for (const stopId of favoriteStopIds) {
        persistedFavoriteState.set(getFavoriteKey(userId, stopId), true);
      }

      set({ favoriteStopIds });
    } catch {
      if (
        loadVersion === favoriteLoadVersion &&
        get().favoriteUserId === userId
      ) {
        set({
          error: "Nie udało się pobrać ulubionych przystanków.",
        });
      }
    }
  },

  toggleFavorite: async (userId, stopId) => {
    // Nie zapisuj ulubionych, dopóki nie jest aktywna lista tego konta.
    if (get().favoriteUserId !== userId) {
      await get().loadFavorites(userId);
    }

    if (get().favoriteUserId !== userId) {
      return;
    }

    const key = getFavoriteKey(userId, stopId);
    const isFavorite = get().favoriteStopIds.includes(stopId);
    const desiredState = !isFavorite;

    const previousQueue = favoriteWriteQueues.get(key);

    if (!previousQueue) {
      persistedFavoriteState.set(key, isFavorite);
    }

    const operationVersion = (favoriteOperationVersions.get(key) ?? 0) + 1;

    favoriteOperationVersions.set(key, operationVersion);

    // Natychmiastowa aktualizacja interfejsu.
    updateFavoriteState(set, userId, stopId, desiredState);
    set({ error: null });

    const queue = previousQueue ?? Promise.resolve();

    const writePromise = queue.then(async () => {
      try {
        if (desiredState) {
          await favoriteRepository.add(userId, stopId);
        } else {
          await favoriteRepository.remove(userId, stopId);
        }

        persistedFavoriteState.set(key, desiredState);
      } catch {
        const isLatestOperation =
          favoriteOperationVersions.get(key) === operationVersion;

        if (isLatestOperation) {
          const lastPersistedState = persistedFavoriteState.get(key) ?? false;

          updateFavoriteState(set, userId, stopId, lastPersistedState);

          if (get().favoriteUserId === userId) {
            set({
              error: "Nie udało się zapisać zmian w ulubionych.",
            });
          }
        }
      }
    });

    favoriteWriteQueues.set(key, writePromise);

    await writePromise;

    if (favoriteWriteQueues.get(key) === writePromise) {
      favoriteWriteQueues.delete(key);
    }
  },
}));
