import { fetchStops } from "../src/infrastructure/api/stopsApi";

describe("ZTM Stops API", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("maps API data to Stop entities using the latest date", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        "2026-11-11": {
          lastUpdate: "2026-11-11 02:34:58",
          stops: [
            {
              stopId: 100,
              stopName: "Old Stop",
              stopLat: 54.35,
              stopLon: 18.64,
              stopDesc: "Old description",
            },
          ],
        },
        "2026-11-12": {
          lastUpdate: "2026-11-12 02:34:58",
          stops: [
            {
              stopId: 8227,
              stopName: "Dąbrowa Centrum",
              stopLat: 54.4734,
              stopLon: 18.46509,
              stopDesc: "Gdynia Dąbrowa Centrum",
            },
          ],
        },
      }),
    } as Response);

    const result = await fetchStops();

    expect(result).toHaveLength(1);
    expect(result[0].stopId).toBe(8227);
    expect(result[0].stopName).toBe("Dąbrowa Centrum");
    expect(result[0].notes).toBe("Gdynia Dąbrowa Centrum");
  });

  test("handles HTTP errors", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    await expect(fetchStops()).rejects.toThrow(
      "ZTM stops API error: 500 Internal Server Error",
    );
  });
});
