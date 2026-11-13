
import { DepartureDelay } from '../src/domain/value-objects/DepartureDelay';

describe('DepartureDelay', () => {
  test('treats zero seconds as on time', () => {
    const delay = new DepartureDelay(0);

    expect(delay.severity).toBe('ON_TIME');
    expect(delay.formattedText).toBe('Na czas');
    expect(delay.shouldAnimate).toBe(false);
  });

  test('does not animate at 119 seconds', () => {
    const delay = new DepartureDelay(119);

    expect(delay.severity).toBe('MINOR');
    expect(delay.formattedText).toBe('+119s');
    expect(delay.shouldAnimate).toBe(false);
  });

  test('animates at exactly 120 seconds', () => {
    const delay = new DepartureDelay(120);

    expect(delay.severity).toBe('MAJOR');
    expect(delay.formattedText).toBe('+2 min');
    expect(delay.shouldAnimate).toBe(true);
  });

  test('formats 175 seconds as 2 minutes', () => {
    const delay = new DepartureDelay(175);

    expect(delay.formattedText).toBe('+2 min');
    expect(delay.shouldAnimate).toBe(true);
  });

  test('treats negative delay as zero', () => {
    const delay = new DepartureDelay(-30);

    expect(delay.seconds).toBe(0);
    expect(delay.severity).toBe('ON_TIME');
    expect(delay.shouldAnimate).toBe(false);
  });

  test('handles missing and invalid delay values', () => {
    expect(new DepartureDelay(null).seconds).toBe(0);
    expect(new DepartureDelay(undefined).seconds).toBe(0);
    expect(new DepartureDelay(Number.NaN).seconds).toBe(0);
  });

  test('compares delays by their seconds', () => {
    expect(new DepartureDelay(120).equals(new DepartureDelay(120))).toBe(true);
    expect(new DepartureDelay(120).equals(new DepartureDelay(180))).toBe(false);
  });
});
