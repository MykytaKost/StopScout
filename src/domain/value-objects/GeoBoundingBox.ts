import { Coordinates } from "./Coordinates";

export class GeoBoundingBox {
  public static readonly MIN_ZOOM_FOR_MARKERS = 15;

  constructor(
    public readonly minLat: number,
    public readonly maxLat: number,
    public readonly minLon: number,
    public readonly maxLon: number,
    public readonly zoomLevel: number,
  ) {
    if (
      !Number.isFinite(minLat) ||
      !Number.isFinite(maxLat) ||
      minLat < -90 ||
      maxLat > 90 ||
      minLat > maxLat
    ) {
      throw new Error("Invalid latitude boundaries.");
    }

    if (
      !Number.isFinite(minLon) ||
      !Number.isFinite(maxLon) ||
      minLon < -180 ||
      maxLon > 180 ||
      minLon > maxLon
    ) {
      throw new Error("Invalid longitude boundaries.");
    }

    if (!Number.isFinite(zoomLevel) || zoomLevel < 0) {
      throw new Error("Invalid zoom level.");
    }
  }

  public shouldRenderMarkers(): boolean {
    return this.zoomLevel >= GeoBoundingBox.MIN_ZOOM_FOR_MARKERS;
  }

  public contains(coordinates: Coordinates): boolean {
    return (
      coordinates.latitude >= this.minLat &&
      coordinates.latitude <= this.maxLat &&
      coordinates.longitude >= this.minLon &&
      coordinates.longitude <= this.maxLon
    );
  }
}
