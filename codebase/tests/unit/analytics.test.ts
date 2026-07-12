import { describe, expect, it } from "vitest";
import {
  costPerKm,
  fleetUtilization,
  fuelEfficiency,
  onTimePerformance,
  operationalCost,
  tripsByDay,
  vehicleRoi,
} from "@/lib/analytics";

describe("analytics formulas", () => {
  it("computes fleet utilization from active non-retired vehicles", () => {
    expect(
      fleetUtilization([
        { status: "ON_TRIP" },
        { status: "AVAILABLE" },
        { status: "IN_SHOP" },
        { status: "RETIRED" },
      ])
    ).toBe(33);
    expect(fleetUtilization([])).toBe(0);
    expect(fleetUtilization([{ status: "RETIRED" }])).toBe(0);
  });

  it("computes fuel efficiency and guards divide-by-zero", () => {
    expect(fuelEfficiency(145, 23)).toBe(6.3);
    expect(fuelEfficiency(100, 0)).toBe(0);
  });

  it("sums operational cost from fuel, maintenance and approved expenses", () => {
    expect(operationalCost(2420, 30800, 620)).toBe(33840);
  });

  it("computes vehicle ROI as percentage of acquisition cost", () => {
    expect(vehicleRoi(21000, 5560, 1450000)).toBe(1.1);
    expect(vehicleRoi(1000, 500, 0)).toBe(0);
  });

  it("computes cost per km", () => {
    expect(costPerKm(33840, 145)).toBe(233.38);
    expect(costPerKm(1000, 0)).toBe(0);
  });

  it("measures on-time performance only over completed trips", () => {
    const planned = new Date("2026-07-10T12:00:00Z");
    expect(
      onTimePerformance([
        {
          status: "COMPLETED",
          plannedCompletion: planned,
          actualCompletion: new Date("2026-07-10T11:00:00Z"),
          plannedDistance: 0,
          expectedRevenue: 0,
          estimatedMargin: 0,
        },
        {
          status: "COMPLETED",
          plannedCompletion: planned,
          actualCompletion: new Date("2026-07-11T12:00:00Z"),
          plannedDistance: 0,
          expectedRevenue: 0,
          estimatedMargin: 0,
        },
        {
          status: "DISPATCHED",
          plannedCompletion: planned,
          plannedDistance: 0,
          expectedRevenue: 0,
          estimatedMargin: 0,
        },
      ])
    ).toBe(50);
    expect(onTimePerformance([])).toBe(100);
  });

  it("buckets trips into trailing daily counts", () => {
    const now = new Date("2026-07-12T10:00:00");
    const series = tripsByDay(
      [
        { plannedStart: new Date("2026-07-12T08:00:00") },
        { plannedStart: new Date("2026-07-11T08:00:00") },
        { plannedStart: new Date("2026-07-01T08:00:00") },
      ],
      7,
      now
    );
    expect(series).toHaveLength(7);
    expect(series[6].value).toBe(1);
    expect(series[5].value).toBe(1);
    expect(series.reduce((s, d) => s + d.value, 0)).toBe(2);
  });
});
