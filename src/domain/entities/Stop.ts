import { Coordinates } from "../value-objects/Coordinates";

export class Stop {
  constructor(
    public readonly stopId: number,
    public stopName: string,
    public readonly coordinates: Coordinates,
    public notes: string = "",
  ) {
    if (!Number.isFinite(stopId)) {
      throw new Error("Stop ID must be a valid number.");
    }
  }

  get stopLat(): number {
    return this.coordinates.latitude;
  }

  get stopLon(): number {
    return this.coordinates.longitude;
  }

  equals(other: Stop | null | undefined): boolean {
    return (
      other !== null && other !== undefined && this.stopId === other.stopId
    );
  }
}
