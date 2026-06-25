import { describe, expect, it } from "vitest";
import { formatDuration, formatPace, providerLabel } from "./format";

describe("format helpers", () => {
  it("formats pace as minutes per kilometer", () => {
    expect(formatPace(322)).toBe("5:22/km");
  });

  it("formats durations", () => {
    expect(formatDuration(2296)).toBe("38 phút");
    expect(formatDuration(5400)).toBe("1 giờ 30 phút");
  });

  it("labels providers", () => {
    expect(providerLabel("strava")).toBe("Strava");
  });
});
