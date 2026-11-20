import { RouteNumber } from "../src/domain/value-objects/RouteNumber";

describe("RouteNumber", () => {
  test("normalizes TRISTAR identifiers", () => {
    expect(new RouteNumber(10177).value).toBe("177");
    expect(new RouteNumber("10169").value).toBe("169");
    expect(new RouteNumber(20210).value).toBe("210");
  });

  test("preserves standard numeric identifiers", () => {
    expect(new RouteNumber(2).value).toBe("2");
    expect(new RouteNumber("6").value).toBe("6");
    expect(new RouteNumber(177).value).toBe("177");
    expect(new RouteNumber(199).value).toBe("199");
  });

  test("normalizes alphanumeric route numbers", () => {
    expect(new RouteNumber("n1").value).toBe("N1");
    expect(new RouteNumber(" t1 ").value).toBe("T1");
    expect(new RouteNumber("N14").value).toBe("N14");
  });

  test("detects night lines", () => {
    expect(new RouteNumber("n1").isNightLine()).toBe(true);
    expect(new RouteNumber("N14").isNightLine()).toBe(true);
    expect(new RouteNumber("T1").isNightLine()).toBe(false);
    expect(new RouteNumber(12).isNightLine()).toBe(false);
  });

  test("handles missing and empty values", () => {
    expect(new RouteNumber(null).value).toBe("?");
    expect(new RouteNumber(undefined).value).toBe("?");
    expect(new RouteNumber("").value).toBe("?");
    expect(new RouteNumber("   ").value).toBe("?");
  });

  test("compares route numbers by value", () => {
    expect(new RouteNumber(10177).equals(new RouteNumber(177))).toBe(true);
    expect(new RouteNumber(177).equals(new RouteNumber("177"))).toBe(true);
    expect(new RouteNumber(177).equals(new RouteNumber(112))).toBe(false);
    expect(new RouteNumber(177).equals(null)).toBe(false);
    expect(new RouteNumber(177).equals(undefined)).toBe(false);
  });
});
