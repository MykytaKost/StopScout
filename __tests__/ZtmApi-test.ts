import { fetchDepartures } from "../src/infrastructure/api/ztmApi";

describe("ZTM API", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const now = new Date("2026-11-12T16:10:00Z");

  const createDeparture = (estimatedTime: string) => ({
    id: "T311R12",
    delayInSeconds: 60,
    estimatedTime,
    headsign: "Zaspa",
    routeId: 12,
    routeShortName: "12",
    scheduledTripStartTime: "2026-11-12T15:21:00Z",
    tripId: 311,
    status: "REALTIME",
    theoreticalTime: "2026-11-12T16:10:00Z",
    timestamp: "2026-11-12T16:09:00Z",
    trip: 30272541,
    vehicleCode: 1064,
    vehicleId: 145754,
    vehicleService: "012-05",
  });

  test("fetches departures for the selected stop", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        lastUpdate: "2026-11-12T16:09:00Z",
        departures: [createDeparture("2026-11-12T16:15:00Z")],
      }),
    } as Response);

    await fetchDepartures(2019, now);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("stopId=2019"),
    );
  });

  test("filters departures older than two minutes", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        lastUpdate: "2026-11-12T16:09:00Z",
        departures: [
          createDeparture("2026-11-12T16:07:59Z"),
          createDeparture("2026-11-12T16:08:00Z"),
          createDeparture("2026-11-12T16:09:00Z"),
          createDeparture("2026-11-12T16:15:00Z"),
        ],
      }),
    } as Response);

    const result = await fetchDepartures(2019, now);

    expect(result).toHaveLength(3);
  });

  test("maps API data to Departure entities", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        lastUpdate: "2026-11-12T16:09:00Z",
        departures: [createDeparture("2026-11-12T16:15:00Z")],
      }),
    } as Response);

    const result = await fetchDepartures(2019, now);

    expect(result[0]).toMatchObject({
      id: "T311R12-30272541",
      routeId: 12,
      headsign: "Zaspa",
      delayInSeconds: 60,
    });
  });

  test("rejects invalid stop IDs", async () => {
    await expect(fetchDepartures(0, now)).rejects.toThrow("Invalid stop ID.");
  });

  test("handles HTTP errors", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(fetchDepartures(2019, now)).rejects.toThrow(
      "ZTM API error: 500 Internal Server Error",
    );
  });
});
