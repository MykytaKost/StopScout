import { Departure } from "../src/domain/entities/Departure";
import { GetLiveDeparturesUseCase } from "../src/use-cases/GetLiveDeparturesUseCase";

describe("GetLiveDeparturesUseCase", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("fetches departures for the selected stop", async () => {
    const expectedDepartures = [
      new Departure(
        "T311R12-30272541",
        12,
        "Zaspa",
        "2026-11-12T16:10:00Z",
        60,
        "2026-11-12T16:15:00Z",
      ),
    ];

    const fetchMock = jest.fn().mockResolvedValue(expectedDepartures);
    const useCase = new GetLiveDeparturesUseCase(fetchMock);

    const result = await useCase.execute(2019);

    expect(fetchMock).toHaveBeenCalledWith(2019, expect.any(Date));
    expect(result).toEqual(expectedDepartures);
  });

  test("uses the current system time when fetching departures", async () => {
    const fixedDate = new Date("2026-11-17T22:00:00Z");

    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);

    const fetchMock = jest.fn().mockResolvedValue([]);
    const useCase = new GetLiveDeparturesUseCase(fetchMock);

    await useCase.execute(2019);

    expect(fetchMock).toHaveBeenCalledWith(2019, fixedDate);
  });

  test("returns an empty list when no departures are available", async () => {
    const fetchMock = jest.fn().mockResolvedValue([]);
    const useCase = new GetLiveDeparturesUseCase(fetchMock);

    const result = await useCase.execute(2019);

    expect(result).toEqual([]);
  });

  test("propagates API errors", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("ZTM API error"));

    const useCase = new GetLiveDeparturesUseCase(fetchMock);

    await expect(useCase.execute(2019)).rejects.toThrow("ZTM API error");
  });
});
