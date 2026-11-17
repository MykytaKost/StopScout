export class Coordinates {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly accuracy: number | null = null,
  ) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error(
        `Nieprawidłowa szerokość geograficzna (latitude): ${latitude}`,
      );
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(
        `Nieprawidłowa długość geograficzna (longitude): ${longitude}`,
      );
    }

    if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0)) {
      throw new Error("Nieprawidłowa dokładność GPS (accuracy).");
    }
  }

  public equals(other: Coordinates | null | undefined): boolean {
    if (!other) {
      return false;
    }

    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  }

  //Oblicza odległość w linii prostej w metrach za pomocą wzoru Haversine'a.
  public distanceToInMeters(other: Coordinates): number {
    const EARTH_RADIUS = 6371e3;

    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const dLat = toRadians(other.latitude - this.latitude);
    const dLon = toRadians(other.longitude - this.longitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(this.latitude)) *
        Math.cos(toRadians(other.latitude)) *
        Math.sin(dLon / 2) ** 2;

    const c =
      2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));

    return Math.round(EARTH_RADIUS * c);
  }
}
