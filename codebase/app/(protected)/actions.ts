"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { driverInput, vehicleInput } from "@/lib/fleet";

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
