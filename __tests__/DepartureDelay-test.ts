import { DepartureDelay } from "../src/domain/value-objects/DepartureDelay";

describe("DepartureDelay", () => {
  test("treats zero, negative and missing delays as ON_TIME", () => {
    const zero = new DepartureDelay(0);
    const negative = new DepartureDelay(-45);
    const missing = new DepartureDelay(null);

    expect(zero.severity).toBe("ON_TIME");
    expect(zero.formattedText).toBe("Na czas");
    expect(zero.shouldAnimate).toBe(false);

    expect(negative.seconds).toBe(0);
    expect(negative.severity).toBe("ON_TIME");
    expect(negative.shouldAnimate).toBe(false);

    expect(missing.severity).toBe("ON_TIME");
    expect(new DepartureDelay(undefined).severity).toBe("ON_TIME");
  });

  test("classifies delays below 120 seconds as MINOR", () => {
    const oneSecond = new DepartureDelay(1);
    const almostTwoMinutes = new DepartureDelay(119);

    expect(oneSecond.severity).toBe("MINOR");
    expect(oneSecond.formattedText).toBe("+1s");
    expect(oneSecond.shouldAnimate).toBe(false);

    expect(almostTwoMinutes.severity).toBe("MINOR");
    expect(almostTwoMinutes.formattedText).toBe("+119s");
    expect(almostTwoMinutes.shouldAnimate).toBe(false);
  });

  test("classifies delays of at least 120 seconds as MAJOR", () => {
    const twoMinutes = new DepartureDelay(120);
    const almostThreeMinutes = new DepartureDelay(179);
    const threeMinutes = new DepartureDelay(180);

    expect(twoMinutes.severity).toBe("MAJOR");
    expect(twoMinutes.formattedText).toBe("+2 min");
    expect(twoMinutes.shouldAnimate).toBe(true);

    expect(almostThreeMinutes.formattedText).toBe("+2 min");
    expect(threeMinutes.formattedText).toBe("+3 min");
  });

  test("handles invalid numeric values safely", () => {
    expect(new DepartureDelay(Number.NaN).seconds).toBe(0);
    expect(new DepartureDelay(Infinity).seconds).toBe(0);
  });

  test("compares delays by their seconds", () => {
    expect(new DepartureDelay(120).equals(new DepartureDelay(120))).toBe(true);
    expect(new DepartureDelay(120).equals(new DepartureDelay(180))).toBe(false);
    expect(new DepartureDelay(120).equals(null)).toBe(false);
    expect(new DepartureDelay(120).equals(undefined)).toBe(false);
  });
});
