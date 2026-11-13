
export interface ZtmStopDto {
  stopId: number;
  stopCode: string;
  stopName: string;
  stopShortName: string;
  stopDesc: string;
  stopLat: number;
  stopLon: number;
  type: string;
  zoneId: number;
  zoneName: string;
  wheelchairBoarding: number;
  virtual: number;
  nonpassenger: number;
  depot: number;
  onDemand: number;
}

export interface ZtmStopsData {
  lastUpdate: string;
  stops: ZtmStopDto[];
}

export type ZtmStopsResponse = Record<string, ZtmStopsData>;
