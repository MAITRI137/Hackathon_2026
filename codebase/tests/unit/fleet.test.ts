import { describe, expect, it } from "vitest";
import { driverCompliance, vehicleInput } from "@/lib/fleet";

describe("fleet rules", () => {
  it("accepts valid vehicle data and blocks manual ON_TRIP changes", () => {
    expect(
      vehicleInput.safeParse({
        registrationNumber: "MH-12-AB-1234",
        name: "Van-05",
        type: "Van",
        maxLoadCapacity: 500,
        odometer: 42000,
        status: "AVAILABLE",
      }).success
    ).toBe(true);
    expect(
      vehicleInput.safeParse({
        registrationNumber: "MH-12-AB-1234",
        name: "Van-05",
        type: "Van",
        maxLoadCapacity: 500,
        odometer: 42000,
        status: "ON_TRIP",
      }).success
    ).toBe(false);
  });

  it("rejects invalid capacity and odometer values", () => {
    expect(
      vehicleInput.safeParse({
        registrationNumber: "MH-12-AB-1234",
        name: "Van-05",
        type: "Van",
        maxLoadCapacity: 0,
        odometer: -1,
        status: "AVAILABLE",
      }).success
    ).toBe(false);
  });

  it("labels driver compliance from licence and status", () => {
    const now = new Date("2026-07-12T00:00:00Z");
    expect(
      driverCompliance(
        { status: "AVAILABLE", licenceExpiry: new Date("2026-12-01") },
        now
      )
    ).toBe("Compliant");
    expect(
      driverCompliance(
        { status: "AVAILABLE", licenceExpiry: new Date("2026-07-30") },
        now
      )
    ).toBe("Expiring Soon");
    expect(
      driverCompliance(
        { status: "AVAILABLE", licenceExpiry: new Date("2026-07-01") },
        now
      )
    ).toBe("Expired");
    expect(
      driverCompliance(
        { status: "SUSPENDED", licenceExpiry: new Date("2026-12-01") },
        now
      )
    ).toBe("Suspended");
  });
});
