import { Stop } from "../../domain/entities/Stop";
import type { ZtmStopsResponse } from "./stops.types";

const ZTM_STOPS_URL =
  "https://ckan.multimediagdansk.pl/dataset/c24aa637-3619-4dc2-a171-a23eec8f2172/resource/4c4025f0-01bf-41f7-a39f-d156d201b82b/download/stops.json";

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

  return latestData.stops.map(
    (item) =>
      new Stop(
        item.stopId,
        item.stopName,
        item.stopLat,
        item.stopLon,
        item.stopDesc,
      ),
  );
}
