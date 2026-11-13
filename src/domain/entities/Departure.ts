export class Departure {
  constructor(
    public readonly id: string | number,
    public readonly routeId: string | number,
    public readonly headsign: string,
    public readonly theoreticalTime: string,
    public readonly delayInSeconds: number | null = 0,
    public readonly estimatedTime?: string,
  ) {}

  equals(other: Departure | null | undefined): boolean {
    return other !== null && other !== undefined && this.id === other.id;
  }
}
