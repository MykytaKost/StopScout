export type DelaySeverity = "ON_TIME" | "MINOR" | "MAJOR";

export class DepartureDelay {
  public readonly seconds: number;
  public readonly severity: DelaySeverity;
  public readonly formattedText: string;
  public readonly shouldAnimate: boolean;

  constructor(rawSeconds: number | null | undefined) {
    const validSeconds =
      typeof rawSeconds === "number" && Number.isFinite(rawSeconds)
        ? rawSeconds
        : 0;

    this.seconds = Math.max(0, validSeconds);

    if (this.seconds === 0) {
      this.severity = "ON_TIME";
      this.formattedText = "Na czas";
      this.shouldAnimate = false;
    } else if (this.seconds < 120) {
      this.severity = "MINOR";
      this.formattedText = `+${Math.floor(this.seconds)}s`;
      this.shouldAnimate = false;
    } else {
      this.severity = "MAJOR";
      this.formattedText = `+${Math.floor(this.seconds / 60)} min`;
      this.shouldAnimate = true;
    }
  }

  public equals(other: DepartureDelay | null | undefined): boolean {
    if (!other) {
      return false;
    }

    return this.seconds === other.seconds;
  }
}
