import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { toCsv } from "@/lib/csv";

const builders: Record<string, () => Promise<{ headers: string[]; rows: unknown[][] }>> = {
  vehicles: async () => ({
    headers: ["Registration", "Name", "Manufacturer", "Model", "Type", "Region", "Capacity (kg)", "Odometer (km)", "Fuel", "Status", "Insurance expiry", "Registration expiry", "Pollution expiry", "Fitness expiry", "Permit expiry"],
    rows: (await db.vehicle.findMany({ orderBy: { name: "asc" } })).map((v) => [v.registrationNumber, v.name, v.manufacturer, v.model, v.type, v.region, v.maxLoadCapacity, v.odometer, v.fuelType, v.status, v.insuranceExpiry, v.registrationExpiry, v.pollutionExpiry, v.fitnessExpiry, v.permitExpiry]),
  }),
  drivers: async () => ({
    headers: ["Name", "Employee ID", "Licence number", "Category", "Licence expiry", "Contact", "Region", "Safety score", "Status", "Date joined"],
    rows: (await db.driver.findMany({ orderBy: { name: "asc" } })).map((d) => [d.name, d.employeeId, d.licenceNumber, d.licenceCategory, d.licenceExpiry, d.contactNumber, d.region, d.safetyScore, d.status, d.dateJoined]),
  }),
  trips: async () => ({
    headers: ["Trip", "Source", "Destination", "Status", "Vehicle", "Driver", "Cargo (kg)", "Distance (km)", "Planned start", "Planned completion", "Revenue", "Estimated margin", "Actual fuel (L)", "Actual fuel cost"],
    rows: (await db.trip.findMany({ include: { vehicle: true, driver: true }, orderBy: { plannedStart: "desc" } })).map((t) => [t.tripNumber, t.source, t.destination, t.status, t.vehicle?.name, t.driver?.name, t.cargoWeight, t.plannedDistance, t.plannedStart, t.plannedCompletion, t.expectedRevenue, t.estimatedMargin, t.actualFuelConsumed, t.actualFuelCost]),
  }),
  maintenance: async () => ({
    headers: ["Vehicle", "Service type", "Description", "Status", "Priority", "Scheduled", "Started", "Completed", "Odometer", "Vendor", "Estimated cost", "Actual cost"],
    rows: (await db.maintenanceLog.findMany({ include: { vehicle: true }, orderBy: { scheduledDate: "desc" } })).map((m) => [m.vehicle.name, m.serviceType, m.description, m.status, m.priority, m.scheduledDate, m.startedDate, m.completedDate, m.odometer, m.vendor, m.estimatedCost, m.actualCost]),
  }),
  fuel: async () => ({
    headers: ["Vehicle", "Trip", "Date", "Litres", "Cost", "Odometer", "Fuel station"],
    rows: (await db.fuelLog.findMany({ include: { vehicle: true, trip: true }, orderBy: { date: "desc" } })).map((f) => [f.vehicle.name, f.trip?.tripNumber, f.date, f.litres, f.cost, f.odometer, f.fuelStation]),
  }),
  expenses: async () => ({
    headers: ["Vehicle", "Trip", "Category", "Amount", "Date", "Description", "Status", "Approved at"],
    rows: (await db.expense.findMany({ include: { vehicle: true, trip: true }, orderBy: { date: "desc" } })).map((e) => [e.vehicle?.name, e.trip?.tripNumber, e.category, e.amount, e.date, e.description, e.status, e.approvedAt]),
  }),
  compliance: async () => ({
    headers: ["Severity", "Entity type", "Message", "Due date", "Status", "Created", "Resolved at"],
    rows: (await db.complianceAlert.findMany({ orderBy: { createdAt: "desc" } })).map((a) => [a.severity, a.entityType, a.message, a.dueDate, a.status, a.createdAt, a.resolvedAt]),
  }),
};
builders.alerts = builders.compliance;

export async function GET(_: Request, { params }: { params: Promise<{ entity: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Authentication required", { status: 401 });
  if (!hasPermission(user, "export:reports")) return new NextResponse("Forbidden: exporting requires the reports export permission", { status: 403 });
  const { entity } = await params;
  const builder = builders[entity];
  if (!builder) return new NextResponse("Unknown export", { status: 404 });
  const { headers, rows } = await builder();
  await db.auditLog.create({ data: { actorId: user.id, action: "CSV_EXPORT", entityType: "Report", details: `${entity} (${rows.length} rows)` } });
  return new NextResponse(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transitops-${entity}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
