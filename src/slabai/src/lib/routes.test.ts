import { describe, expect, it } from "vitest";
import { navGroups, routes } from "./routes";

describe("route configuration", () => {
  it("keeps Insights scoped to Profiles & Zones", () => {
    const insights = navGroups.find((group) => group.label === "Insights");
    expect(insights?.items).toHaveLength(1);
    expect(insights?.items[0]?.href).toBe(routes.insightsProfilesZones);
  });

  it("keeps Training navigation focused on current scope", () => {
    const training = navGroups.find((group) => group.label === "Training");
    expect(training?.items.map((item) => item.href)).toEqual([routes.calendar, routes.planSport]);
  });

  it("defines all P0 plan routes", () => {
    expect(routes.planSport).toBe("/plan-builder/sport");
    expect(routes.planReview).toBe("/plan-builder/review");
  });
});
