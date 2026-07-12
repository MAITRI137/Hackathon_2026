"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { driverInput, vehicleInput } from "@/lib/fleet";
import { dispatchProblems } from "@/lib/dispatch";
import { fallbackRoute } from "@/lib/routes";

const future = (days: number) => new Date(Date.now() + days * 86_400_000);

export async function createVehicle(formData: FormData) {
  const user = await requirePermission("manage:vehicles");
  const parsed = vehicleInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/vehicles?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  try {
    await db.vehicle.create({ data: { ...parsed.data, manufacturer: String(formData.get("manufacturer") || "Tata"), model: String(formData.get("model") || parsed.data.name), region: String(formData.get("region") || "West"), acquisitionCost: Number(formData.get("acquisitionCost") || 0), acquisitionDate: new Date(), fuelType: String(formData.get("fuelType") || "Diesel"), insuranceExpiry: future(180), registrationExpiry: future(300), pollutionExpiry: future(90), fitnessExpiry: future(240), permitExpiry: future(160) } });
    await db.auditLog.create({ data: { actorId: user.id, action: "CREATE", entityType: "Vehicle", details: parsed.data.registrationNumber } });
  } catch { redirect("/vehicles?error=Registration%20number%20must%20be%20unique"); }
  revalidatePath("/vehicles");
  redirect("/vehicles?message=Vehicle%20created");
}

export async function retireVehicle(formData: FormData) {
  const user = await requirePermission("manage:vehicles");
  const id = String(formData.get("id"));
  const vehicle = await db.vehicle.findUniqueOrThrow({ where: { id } });
  if (vehicle.status === "ON_TRIP") redirect("/vehicles?error=An%20active%20vehicle%20cannot%20be%20retired");
  await db.$transaction([db.vehicle.update({ where: { id }, data: { status: "RETIRED" } }), db.auditLog.create({ data: { actorId: user.id, action: "RETIRE", entityType: "Vehicle", entityId: id } })]);
  revalidatePath("/vehicles");
}

export async function createDriver(formData: FormData) {
  const user = await requirePermission("manage:drivers");
  const parsed = driverInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/drivers?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  try {
    await db.driver.create({ data: { ...parsed.data, region: String(formData.get("region") || "West"), dateJoined: new Date(), emergencyContact: String(formData.get("emergencyContact") || "") } });
    await db.auditLog.create({ data: { actorId: user.id, action: "CREATE", entityType: "Driver", details: parsed.data.licenceNumber } });
  } catch { redirect("/drivers?error=Licence%20number%20and%20employee%20ID%20must%20be%20unique"); }
  revalidatePath("/drivers");
  redirect("/drivers?message=Driver%20created");
}

export async function setDriverStatus(formData: FormData) {
  const user = await requirePermission("manage:drivers");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!new Set(["AVAILABLE", "OFF_DUTY", "SUSPENDED"]).has(status)) return;
  await db.$transaction([db.driver.update({ where: { id }, data: { status } }), db.auditLog.create({ data: { actorId: user.id, action: status, entityType: "Driver", entityId: id } })]);
  revalidatePath("/drivers");
}

export async function createTrip(formData: FormData) {
  const user = await requirePermission("manage:trips");
  const source = String(formData.get("source"));
  const destination = String(formData.get("destination"));
  const vehicleId = String(formData.get("vehicleId"));
  const driverId = String(formData.get("driverId"));
  const cargoWeight = Number(formData.get("cargoWeight"));
  const expectedRevenue = Number(formData.get("expectedRevenue"));
  const plannedStart = new Date(String(formData.get("plannedStart")));
  const plannedCompletion = new Date(String(formData.get("plannedCompletion")));
  if (!source || !destination || source === destination || cargoWeight <= 0 || plannedStart >= plannedCompletion) redirect("/trips?error=Enter%20a%20valid%20route%2C%20cargo%20weight%20and%20schedule");
  const route = fallbackRoute(source, destination);
  await db.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
    await tx.driver.findUniqueOrThrow({ where: { id: driverId } });
    const fuel = Math.round(route.distanceKm / (vehicle.type.includes("Truck") ? 6 : 12) * 105);
    const reserve = Math.round(route.distanceKm * 9);
    const trip = await tx.trip.create({ data: { tripNumber: `TRP-${Date.now().toString().slice(-6)}`, source, destination, sourceLat: route.start[0], sourceLng: route.start[1], destinationLat: route.end[0], destinationLng: route.end[1], plannedStart, plannedCompletion, vehicleId, driverId, cargoDescription: String(formData.get("cargoDescription") || "General cargo"), cargoWeight, plannedDistance: route.distanceKm, estimatedDuration: route.durationMinutes, startingOdometer: vehicle.odometer, expectedRevenue, estimatedFuelCost: fuel, estimatedTollCost: Math.round(route.distanceKm * 4), estimatedMaintenanceReserve: reserve, estimatedMargin: expectedRevenue - fuel - reserve - Math.round(route.distanceKm * 4) } });
    await tx.tripEvent.create({ data: { tripId: trip.id, type: "DRAFT", message: "Trip draft created", createdById: user.id } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "DRAFT", entityType: "Trip", entityId: trip.id } });
  });
  revalidatePath("/trips");
  redirect("/trips?message=Trip%20draft%20created");
}

export async function dispatchTrip(formData: FormData) {
  const user = await requirePermission("manage:trips");
  const id = String(formData.get("id"));
  let failure = "";
  try {
    await db.$transaction(async (tx) => {
      const trip = await tx.trip.findUniqueOrThrow({ where: { id }, include: { vehicle: true, driver: true } });
      if (trip.status !== "DRAFT" || !trip.vehicle || !trip.driver) throw new Error("Only a complete draft can be dispatched.");
      const overlap = await tx.trip.count({ where: { id: { not: id }, status: "DISPATCHED", OR: [{ vehicleId: trip.vehicleId }, { driverId: trip.driverId }], plannedStart: { lt: trip.plannedCompletion }, plannedCompletion: { gt: trip.plannedStart } } });
      const problems = dispatchProblems({ cargoWeight: trip.cargoWeight, distanceKm: trip.plannedDistance, expectedRevenue: trip.expectedRevenue, plannedCompletion: trip.plannedCompletion }, { id: trip.vehicle.id, name: trip.vehicle.name, status: trip.vehicle.status, type: trip.vehicle.type, maxLoadCapacity: trip.vehicle.maxLoadCapacity, fuelEfficiency: trip.vehicle.type.includes("Truck") ? 6 : 12, documentsValid: [trip.vehicle.insuranceExpiry, trip.vehicle.registrationExpiry, trip.vehicle.pollutionExpiry, trip.vehicle.fitnessExpiry, trip.vehicle.permitExpiry].every((date) => date >= trip.plannedCompletion), maintenanceHealthy: trip.vehicle.status !== "IN_SHOP" }, { id: trip.driver.id, name: trip.driver.name, status: trip.driver.status, licenceCategory: trip.driver.licenceCategory, licenceExpiry: trip.driver.licenceExpiry, safetyScore: trip.driver.safetyScore });
      if (overlap) problems.push("Vehicle or driver has a conflicting trip.");
      if (problems.length) throw new Error(problems.join(" "));
      const [vehicle, driver] = await Promise.all([tx.vehicle.updateMany({ where: { id: trip.vehicle.id, status: "AVAILABLE" }, data: { status: "ON_TRIP" } }), tx.driver.updateMany({ where: { id: trip.driver.id, status: "AVAILABLE" }, data: { status: "ON_TRIP" } })]);
      if (vehicle.count !== 1 || driver.count !== 1) throw new Error("Vehicle or driver availability changed. Refresh and retry.");
      await tx.trip.update({ where: { id }, data: { status: "DISPATCHED", actualStart: new Date() } });
      await tx.tripEvent.create({ data: { tripId: id, type: "DISPATCHED", message: `${trip.vehicle.name} and ${trip.driver.name} assigned`, createdById: user.id } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "DISPATCH", entityType: "Trip", entityId: id } });
    });
  } catch (error) { failure = error instanceof Error ? error.message : "Dispatch failed"; }
  revalidatePath("/trips"); revalidatePath("/dashboard");
  redirect(`/trips?${failure ? `error=${encodeURIComponent(failure)}` : "message=Trip%20dispatched"}`);
}

export async function completeTrip(formData: FormData) {
  const user = await requirePermission("manage:trips");
  const id = String(formData.get("id"));
  const finalOdometer = Number(formData.get("finalOdometer"));
  const litres = Number(formData.get("litres") || 0);
  const fuelCost = Number(formData.get("fuelCost") || 0);
  let failure = "";
  try { await db.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id } });
    if (trip.status !== "DISPATCHED" || !trip.vehicleId || !trip.driverId) throw new Error("Only a dispatched trip can be completed.");
    if (!trip.startingOdometer || finalOdometer < trip.startingOdometer) throw new Error("Final odometer cannot be below the starting odometer.");
    await tx.trip.update({ where: { id }, data: { status: "COMPLETED", finalOdometer, actualCompletion: new Date(), actualFuelConsumed: litres || null, actualFuelCost: fuelCost || null } });
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE", odometer: finalOdometer } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    if (litres > 0 && fuelCost > 0) await tx.fuelLog.create({ data: { vehicleId: trip.vehicleId, tripId: id, date: new Date(), litres, cost: fuelCost, odometer: finalOdometer, enteredById: user.id } });
    await tx.tripEvent.create({ data: { tripId: id, type: "COMPLETED", message: "Trip completed and resources released", createdById: user.id } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "COMPLETE", entityType: "Trip", entityId: id } });
  }); } catch (error) { failure = error instanceof Error ? error.message : "Completion failed"; }
  revalidatePath("/trips"); revalidatePath("/dashboard");
  redirect(`/trips?${failure ? `error=${encodeURIComponent(failure)}` : "message=Trip%20completed"}`);
}

export async function cancelTrip(formData: FormData) {
  const user = await requirePermission("manage:trips");
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) redirect("/trips?error=Cancellation%20reason%20is%20required");
  await db.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id } });
    if (!["DRAFT", "DISPATCHED"].includes(trip.status)) throw new Error("This trip can no longer be cancelled.");
    await tx.trip.update({ where: { id }, data: { status: "CANCELLED", cancellationReason: reason } });
    if (trip.status === "DISPATCHED") { if (trip.vehicleId) await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } }); if (trip.driverId) await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }); }
    await tx.tripEvent.create({ data: { tripId: id, type: "CANCELLED", message: reason, createdById: user.id } });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CANCEL", entityType: "Trip", entityId: id, details: reason } });
  });
  revalidatePath("/trips"); revalidatePath("/dashboard");
  redirect("/trips?message=Trip%20cancelled");
}
