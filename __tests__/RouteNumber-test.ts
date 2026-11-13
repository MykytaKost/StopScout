import { RouteNumber } from "../src/domain/value-objects/RouteNumber";

describe("RouteNumber", () => {
  test("normalizes 10177 to 177", () => {
    expect(new RouteNumber(10177).value).toBe("177");
  });

  test("keeps a short route number unchanged", () => {
    expect(new RouteNumber(177).value).toBe("177");
  });

  test("normalizes a night line", () => {
    const route = new RouteNumber(" n1 ");

    expect(route.value).toBe("N1");
    expect(route.isNightLine()).toBe(true);
  });

  test("returns ? for a missing route number", () => {
    expect(new RouteNumber(null).value).toBe("?");
    expect(new RouteNumber(undefined).value).toBe("?");
  });

  test("compares route numbers by value", () => {
    expect(new RouteNumber(10177).equals(new RouteNumber(177))).toBe(true);
    expect(new RouteNumber(177).equals(new RouteNumber(112))).toBe(false);
  });
});
