export class Stop {
  constructor(
    public readonly stopId: number,
    public stopName: string,
    public stopLat: number,
    public stopLon: number,
    public notes: string = "",
  ) {
    if (!Number.isFinite(stopId)) {
      throw new Error("Stop ID must be a valid number.");
    }

    if (!Number.isFinite(stopLat) || stopLat < -90 || stopLat > 90) {
      throw new Error("Invalid latitude.");
    }

    if (!Number.isFinite(stopLon) || stopLon < -180 || stopLon > 180) {
      throw new Error("Invalid longitude.");
    }
  }

  equals(other: Stop | null | undefined): boolean {
    return (
      other !== null && other !== undefined && this.stopId === other.stopId
    );
  }
}
