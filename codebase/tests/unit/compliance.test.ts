import { describe, expect, it } from "vitest";
import { scanCompliance } from "@/lib/compliance";

const now = new Date("2026-07-12T00:00:00Z");
const day = (offset: number) => new Date(now.getTime() + offset * 86_400_000);

const baseVehicle = {
  id: "v1",
  name: "Van-05",
  status: "AVAILABLE",
  acquisitionCost: 1_000_000,
  insuranceExpiry: day(180),
  registrationExpiry: day(180),
  pollutionExpiry: day(180),
  fitnessExpiry: day(180),
  permitExpiry: day(180),
};

describe("compliance scan", () => {
  it("flags expired and expiring driver licences and suspensions", () => {
    const alerts = scanCompliance({
      drivers: [
        { id: "d1", name: "Raj", status: "AVAILABLE", licenceExpiry: day(-30) },
        { id: "d2", name: "Neha", status: "AVAILABLE", licenceExpiry: day(15) },
        { id: "d3", name: "Priya", status: "SUSPENDED", licenceExpiry: day(150) },
        { id: "d4", name: "Alex", status: "AVAILABLE", licenceExpiry: day(365) },
      ],
      vehicles: [],
      maintenance: [],
      trips: [],
      now,
    });
    expect(alerts.find((a) => a.entityId === "d1")?.severity).toBe("CRITICAL");
    expect(alerts.find((a) => a.entityId === "d2")?.severity).toBe("WARNING");
    expect(alerts.find((a) => a.entityId === "d3")?.message).toContain("suspended");
    expect(alerts.filter((a) => a.entityId === "d4")).toHaveLength(0);
  });

  it("flags expired vehicle documents but skips retired vehicles", () => {
    const alerts = scanCompliance({
      drivers: [],
      vehicles: [
        { ...baseVehicle, pollutionExpiry: day(-5) },
        { ...baseVehicle, id: "v2", name: "Bus-01", status: "RETIRED", insuranceExpiry: day(-99) },
      ],
      maintenance: [],
      trips: [],
      now,
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("pollution certificate expired");
  });

  it("flags overdue maintenance, negative margins and low efficiency", () => {
    const alerts = scanCompliance({
      drivers: [],
      vehicles: [],
      maintenance: [{ id: "m1", vehicleName: "Van-03", status: "SCHEDULED", scheduledDate: day(-2) }],
      trips: [
        { id: "t1", tripNumber: "TRP-1", status: "DRAFT", estimatedMargin: -500, plannedDistance: 100, actualFuelConsumed: null },
        { id: "t2", tripNumber: "TRP-2", status: "COMPLETED", estimatedMargin: 1000, plannedDistance: 100, actualFuelConsumed: 40 },
      ],
      now,
    });
    expect(alerts.find((a) => a.entityType === "Maintenance")?.message).toContain("overdue");
    expect(alerts.find((a) => a.entityId === "t1")?.message).toContain("negative estimated margin");
    expect(alerts.find((a) => a.entityId === "t2")?.message).toContain("low fuel efficiency");
  });

  it("returns nothing for a healthy fleet", () => {
    expect(
      scanCompliance({
        drivers: [{ id: "d1", name: "Alex", status: "AVAILABLE", licenceExpiry: day(200) }],
        vehicles: [baseVehicle],
        maintenance: [{ id: "m1", vehicleName: "Van-05", status: "SCHEDULED", scheduledDate: day(5) }],
        trips: [{ id: "t1", tripNumber: "TRP-1", status: "COMPLETED", estimatedMargin: 5000, plannedDistance: 145, actualFuelConsumed: 23 }],
        now,
      }),
    ).toHaveLength(0);
  });
});
