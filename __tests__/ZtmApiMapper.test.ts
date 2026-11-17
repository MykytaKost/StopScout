import { mapZtmDeparture } from "../src/infrastructure/api/ZtmApiMapper";
import type { ZtmDepartureDto } from "../src/infrastructure/api/ztm.types";
import { Departure } from "../src/domain/entities/Departure";

describe("ZtmApiMapper", () => {
  const dto: ZtmDepartureDto = {
    id: "T311R12",
    delayInSeconds: 60,
    estimatedTime: "2026-11-12T16:15:00Z",
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
  };

  test("maps ZTM DTO to Departure entity", () => {
    const result = mapZtmDeparture(dto);

    expect(result).toBeInstanceOf(Departure);
    expect(result).toEqual(
      new Departure(
        "T311R12-30272541",
        12,
        "Zaspa",
        "2026-11-12T16:10:00Z",
        60,
        "2026-11-12T16:15:00Z",
      ),
    );
  });

  test("preserves departure information", () => {
    const result = mapZtmDeparture(dto);

    expect(result.id).toBe("T311R12-30272541");
    expect(result.routeId).toBe(12);
    expect(result.headsign).toBe("Zaspa");
    expect(result.theoreticalTime).toBe("2026-11-12T16:10:00Z");
    expect(result.estimatedTime).toBe("2026-11-12T16:15:00Z");
    expect(result.delayInSeconds).toBe(60);
  });
});