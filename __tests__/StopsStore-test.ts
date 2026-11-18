import { useStopsStore } from "../src/store/useStopsStore";
import { FavoriteStopRepository } from "../src/data/repositories/FavoriteStopRepository";

jest.mock("../src/data/repositories/FavoriteStopRepository");

const mockedRepository = jest.mocked(FavoriteStopRepository);

const USER_ID = 1;

describe("Stops Store - Optimistic UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedRepository.prototype.getAll.mockResolvedValue([]);

    useStopsStore.setState({
      stops: [],
      selectedStop: null,
      favoriteStopIds: [],
      favoriteUserId: USER_ID,
      isLoading: false,
      error: null,
    });
  });

  it("should update favorites immediately", async () => {
    mockedRepository.prototype.add.mockResolvedValue(undefined);

    const promise = useStopsStore.getState().toggleFavorite(USER_ID, 10);

    expect(useStopsStore.getState().favoriteStopIds).toEqual([10]);

    await promise;

    expect(mockedRepository.prototype.add).toHaveBeenCalledWith(USER_ID, 10);
  });

  it("should rollback when saving favorite fails", async () => {
    mockedRepository.prototype.add.mockRejectedValue(
      new Error("Database error"),
    );

    await useStopsStore.getState().toggleFavorite(USER_ID, 10);

    expect(useStopsStore.getState().favoriteStopIds).toEqual([]);
    expect(useStopsStore.getState().error).toBe(
      "Nie udało się zapisać zmian w ulubionych.",
    );
  });

  it("should remove a favorite", async () => {
    useStopsStore.setState({
      favoriteStopIds: [10],
    });

    mockedRepository.prototype.remove.mockResolvedValue(undefined);

    await useStopsStore.getState().toggleFavorite(USER_ID, 10);

    expect(useStopsStore.getState().favoriteStopIds).toEqual([]);
    expect(mockedRepository.prototype.remove).toHaveBeenCalledWith(USER_ID, 10);
  });

  it("should not rollback another stop when one save fails", async () => {
    let rejectFirst!: (error: Error) => void;
    let resolveSecond!: () => void;

    const firstWrite = new Promise<void>((_, reject) => {
      rejectFirst = reject;
    });

    const secondWrite = new Promise<void>((resolve) => {
      resolveSecond = resolve;
    });

    mockedRepository.prototype.add.mockImplementation(
      (_userId: number, stopId: number) => {
        return stopId === 10 ? firstWrite : secondWrite;
      },
    );

    const firstToggle = useStopsStore.getState().toggleFavorite(USER_ID, 10);

    const secondToggle = useStopsStore.getState().toggleFavorite(USER_ID, 20);

    expect(useStopsStore.getState().favoriteStopIds).toEqual([10, 20]);

    rejectFirst(new Error("Database error"));
    resolveSecond();

    await Promise.all([firstToggle, secondToggle]);

    expect(useStopsStore.getState().favoriteStopIds).toEqual([20]);
    expect(useStopsStore.getState().error).toBe(
      "Nie udało się zapisać zmian w ulubionych.",
    );
  });

  it("should execute consecutive operations for the same stop in order", async () => {
    let resolveAdd!: () => void;

    const addPromise = new Promise<void>((resolve) => {
      resolveAdd = resolve;
    });

    mockedRepository.prototype.add.mockReturnValue(addPromise);
    mockedRepository.prototype.remove.mockResolvedValue(undefined);

    const firstToggle = useStopsStore.getState().toggleFavorite(USER_ID, 10);

    const secondToggle = useStopsStore.getState().toggleFavorite(USER_ID, 10);

    expect(useStopsStore.getState().favoriteStopIds).toEqual([]);

    await Promise.resolve();

    expect(mockedRepository.prototype.add).toHaveBeenCalledWith(USER_ID, 10);

    expect(mockedRepository.prototype.remove).not.toHaveBeenCalled();

    resolveAdd();

    await Promise.all([firstToggle, secondToggle]);

    expect(mockedRepository.prototype.remove).toHaveBeenCalledWith(USER_ID, 10);

    expect(
      mockedRepository.prototype.add.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mockedRepository.prototype.remove.mock.invocationCallOrder[0],
    );

    expect(useStopsStore.getState().favoriteStopIds).toEqual([]);
  });
});
