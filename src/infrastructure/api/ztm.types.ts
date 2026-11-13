export interface ZtmDeparturesResponse {
  lastUpdate: string;
  departures: ZtmDepartureDto[];
}

export interface ZtmDepartureDto {
  id: string;
  delayInSeconds: number;
  estimatedTime: string;
  headsign: string;
  routeId: number;
  routeShortName: string;
  scheduledTripStartTime: string;
  tripId: number;
  status: string;
  theoreticalTime: string;
  timestamp: string;
  trip: number;
  vehicleCode: number;
  vehicleId: number;
  vehicleService: string;
}
