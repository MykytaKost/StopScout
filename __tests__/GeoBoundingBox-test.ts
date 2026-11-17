
import { GeoBoundingBox } from "../src/domain/value-objects/GeoBoundingBox";
import { Coordinates } from "../src/domain/value-objects/Coordinates";

describe("Value Object: GeoBoundingBox", () => {
  const box = new GeoBoundingBox(
    54.30,
    54.40,
    18.60,
    18.70,
    15,
  );

  it("tworzy poprawny obszar geograficzny", () => {
    expect(box.minLat).toBe(54.30);
    expect(box.maxLat).toBe(54.40);
    expect(box.minLon).toBe(18.60);
    expect(box.maxLon).toBe(18.70);
    expect(box.zoomLevel).toBe(15);
  });

  it("odrzuca nieprawidłowe granice szerokości geograficznej", () => {
    expect(() => new GeoBoundingBox(55, 54, 18, 19, 15)).toThrow();
    expect(() => new GeoBoundingBox(-91, 54, 18, 19, 15)).toThrow();
    expect(() => new GeoBoundingBox(54, 91, 18, 19, 15)).toThrow();
  });

  it("odrzuca nieprawidłowe granice długości geograficznej", () => {
    expect(() => new GeoBoundingBox(54, 55, 20, 19, 15)).toThrow();
    expect(() => new GeoBoundingBox(54, 55, -181, 19, 15)).toThrow();
    expect(() => new GeoBoundingBox(54, 55, 18, 181, 15)).toThrow();
  });

  it("odrzuca nieprawidłowy poziom przybliżenia", () => {
    expect(() => new GeoBoundingBox(54, 55, 18, 19, -1)).toThrow();
    expect(() => new GeoBoundingBox(54, 55, 18, 19, NaN)).toThrow();
  });

  it("nie wyświetla markerów przy zoomLevel 14", () => {
    const lowZoom = new GeoBoundingBox(54, 55, 18, 19, 14);
    expect(lowZoom.shouldRenderMarkers()).toBe(false);
  });

  it("wyświetla markery przy zoomLevel 15 lub wyższym", () => {
    const zoom15 = new GeoBoundingBox(54, 55, 18, 19, 15);
    const zoom16 = new GeoBoundingBox(54, 55, 18, 19, 16);

    expect(zoom15.shouldRenderMarkers()).toBe(true);
    expect(zoom16.shouldRenderMarkers()).toBe(true);
  });

  it("rozpoznaje współrzędne znajdujące się wewnątrz obszaru", () => {
    const point = new Coordinates(54.35, 18.65);
    expect(box.contains(point)).toBe(true);
  });

  it("rozpoznaje współrzędne leżące dokładnie na granicy", () => {
    const point = new Coordinates(54.30, 18.60);
    expect(box.contains(point)).toBe(true);
  });

  it("odrzuca współrzędne spoza obszaru", () => {
    const point = new Coordinates(54.50, 18.65);
    expect(box.contains(point)).toBe(false);
  });
});
