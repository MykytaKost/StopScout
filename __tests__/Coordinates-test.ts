import { Coordinates } from "../src/domain/value-objects/Coordinates";

describe("Value Object: Coordinates", () => {
  it("tworzy poprawne współrzędne", () => {
    const coords = new Coordinates(54.352, 18.646);

    expect(coords.latitude).toBe(54.352);
    expect(coords.longitude).toBe(18.646);
    expect(coords.accuracy).toBeNull();
  });

  it("przechowuje dokładność GPS", () => {
    const coords = new Coordinates(54.352, 18.646, 5);

    expect(coords.accuracy).toBe(5);
  });

  it("rzuca wyjątek dla nieprawidłowej szerokości geograficznej", () => {
    expect(() => new Coordinates(95, 18)).toThrow();
    expect(() => new Coordinates(-91, 18)).toThrow();
    expect(() => new Coordinates(NaN, 18)).toThrow();
    expect(() => new Coordinates(Infinity, 18)).toThrow();
  });

  it("rzuca wyjątek dla nieprawidłowej długości geograficznej", () => {
    expect(() => new Coordinates(54, 185)).toThrow();
    expect(() => new Coordinates(54, -181)).toThrow();
    expect(() => new Coordinates(54, NaN)).toThrow();
    expect(() => new Coordinates(54, Infinity)).toThrow();
  });

  it("odrzuca nieprawidłową dokładność GPS", () => {
    expect(() => new Coordinates(54, 18, -1)).toThrow();
    expect(() => new Coordinates(54, 18, NaN)).toThrow();
  });

  it("porównuje współrzędne metodą equals()", () => {
    const point1 = new Coordinates(54.352, 18.646);
    const point2 = new Coordinates(54.352, 18.646);
    const point3 = new Coordinates(54.37, 18.61);

    expect(point1.equals(point2)).toBe(true);
    expect(point1.equals(point3)).toBe(false);
    expect(point1.equals(null)).toBe(false);
    expect(point1.equals(undefined)).toBe(false);
  });

  it("oblicza odległość metodą Haversine'a", () => {
    const gdansk = new Coordinates(54.352, 18.646);
    const sopot = new Coordinates(54.4418, 18.56);

    expect(gdansk.distanceToInMeters(gdansk)).toBe(0);

    const distance = gdansk.distanceToInMeters(sopot);

    expect(distance).toBeGreaterThan(11000);
    expect(distance).toBeLessThan(12000);
  });
});
