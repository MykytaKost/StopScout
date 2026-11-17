import { Departure } from "../../domain/entities/Departure";
import type { ZtmDepartureDto } from "./ztm.types";

export function mapZtmDeparture(dto: ZtmDepartureDto): Departure {
  return new Departure(
    `${dto.id}-${dto.trip}`,
    dto.routeId,
    dto.headsign,
    dto.theoreticalTime,
    dto.delayInSeconds,
    dto.estimatedTime,
  );
}
