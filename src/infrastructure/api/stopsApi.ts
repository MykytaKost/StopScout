import { Stop } from "../../domain/entities/Stop";
import type { ZtmStopsResponse } from "./stops.types";
import { Coordinates } from "../../domain/value-objects/Coordinates";
import type { StopType } from "../../domain/entities/Stop";

const ZTM_STOPS_URL =
  "https://ckan.multimediagdansk.pl/dataset/c24aa637-3619-4dc2-a171-a23eec8f2172/resource/4c4025f0-01bf-41f7-a39f-d156d201b82b/download/stops.json";

function normalizeStopType(type: string): StopType {
  switch (type) {
    case "BUS":
    case "TRAM":
    case "BUS_TRAM":
      return type;
    default:
      return "UNKNOWN";
  }
}

export async function fetchStops(): Promise<Stop[]> {
  const response = await fetch(ZTM_STOPS_URL);

  if (!response.ok) {
    throw new Error(
      `ZTM stops API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: ZtmStopsResponse = await response.json();

  const dates = Object.keys(data).sort().reverse();
  const latestData = data[dates[0]];

  if (!latestData || !Array.isArray(latestData.stops)) {
    throw new Error("Invalid stops response from ZTM API.");
  }

  const validStops = latestData.stops.filter(
    (item) =>
      Number.isFinite(item.stopId) &&
      typeof item.stopName === "string" &&
      item.stopName.trim().length > 0 &&
      Number.isFinite(item.stopLat) &&
      Number.isFinite(item.stopLon),
  );

  console.log(
    `ZTM: pominięto ${latestData.stops.length - validStops.length} nieprawidłowych rekordów.`,
  );

  return validStops.map(
    (item) =>
      new Stop(
        item.stopId,
        item.stopName.trim(),
        new Coordinates(item.stopLat, item.stopLon),
        item.stopDesc ?? "",
        normalizeStopType(item.type),
      ),
  );
}
