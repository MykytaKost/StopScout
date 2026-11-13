import { Departure } from "../../domain/entities/Departure";
import type { ZtmDeparturesResponse } from "./ztm.types";

const ZTM_API_URL = "https://ckan2.multimediagdansk.pl/departures";

const DEPARTURE_EXPIRATION_MS = 2 * 60 * 1000;


export async function fetchDepartures(
  stopId: number,
  now: Date = new Date(),
): Promise<Departure[]> {
  if (!Number.isFinite(stopId) || stopId <= 0) {
    throw new Error("Invalid stop ID.");
  }

  const url = `${ZTM_API_URL}?stopId=${encodeURIComponent(stopId)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ZTM API error: ${response.status} ${response.statusText}`);
  }

  const data: ZtmDeparturesResponse = await response.json();

  if (!Array.isArray(data.departures)) {
    throw new Error("Invalid response from ZTM API.");
  }

  const currentTime = now.getTime();

  return data.departures
    .filter((departure) => {
      const departureTime = Date.parse(
        departure.estimatedTime || departure.theoreticalTime,
      );

      if (!Number.isFinite(departureTime)) {
        return false;
      }

      return currentTime - departureTime <= DEPARTURE_EXPIRATION_MS;
    })
    .map(
      (departure) =>
        new Departure(
          `${departure.id}-${departure.trip}`,
          departure.routeId,
          departure.headsign,
          departure.theoreticalTime,
          departure.delayInSeconds,
          departure.estimatedTime,
        ),
    );
}
