export type AlertDraft = {
  severity: "INFO" | "WARNING" | "CRITICAL";
  entityType: "Driver" | "Vehicle" | "Trip" | "Maintenance";
  entityId: string;
  message: string;
  dueDate: Date | null;
};

type ScanInput = {
  drivers: { id: string; name: string; status: string; licenceExpiry: Date }[];
  vehicles: {
    id: string;
    name: string;
    status: string;
    acquisitionCost: number;
    insuranceExpiry: Date;
    registrationExpiry: Date;
    pollutionExpiry: Date;
    fitnessExpiry: Date;
    permitExpiry: Date;
  }[];
  maintenance: {
    id: string;
    vehicleName: string;
    status: string;
    scheduledDate: Date;
  }[];
  trips: {
    id: string;
    tripNumber: string;
    status: string;
    estimatedMargin: number;
    plannedDistance: number;
    actualFuelConsumed: number | null;
  }[];
  maintenanceCostByVehicle?: Record<string, number>;
  now?: Date;
};

const DAY = 86_400_000;

/** Deterministic compliance rules; returns alert drafts for everything currently out of policy. */
export function scanCompliance({
  drivers,
  vehicles,
  maintenance,
  trips,
  maintenanceCostByVehicle = {},
  now = new Date(),
}: ScanInput): AlertDraft[] {
  const alerts: AlertDraft[] = [];
  const daysTo = (d: Date) => (d.getTime() - now.getTime()) / DAY;

  for (const d of drivers) {
    if (d.status === "SUSPENDED")
      alerts.push({
        severity: "WARNING",
        entityType: "Driver",
        entityId: d.id,
        message: `${d.name} is suspended and cannot be assigned to trips.`,
        dueDate: null,
      });
    if (daysTo(d.licenceExpiry) < 0)
      alerts.push({
        severity: "CRITICAL",
        entityType: "Driver",
        entityId: d.id,
        message: `${d.name}'s driving licence expired on ${d.licenceExpiry.toLocaleDateString("en-IN")}.`,
        dueDate: d.licenceExpiry,
      });
    else if (daysTo(d.licenceExpiry) <= 30)
      alerts.push({
        severity: "WARNING",
        entityType: "Driver",
        entityId: d.id,
        message: `${d.name}'s driving licence expires within 30 days.`,
        dueDate: d.licenceExpiry,
      });
  }

  const docs: [keyof (typeof vehicles)[number], string][] = [
    ["insuranceExpiry", "insurance"],
    ["registrationExpiry", "registration"],
    ["pollutionExpiry", "pollution certificate"],
    ["fitnessExpiry", "fitness certificate"],
    ["permitExpiry", "permit"],
  ];
  for (const v of vehicles) {
    if (v.status === "RETIRED") continue;
    for (const [field, label] of docs) {
      const date = v[field] as Date;
      if (daysTo(date) < 0)
        alerts.push({
          severity: "CRITICAL",
          entityType: "Vehicle",
          entityId: v.id,
          message: `${v.name} ${label} expired on ${date.toLocaleDateString("en-IN")}.`,
          dueDate: date,
        });
      else if (field === "insuranceExpiry" && daysTo(date) <= 30)
        alerts.push({
          severity: "WARNING",
          entityType: "Vehicle",
          entityId: v.id,
          message: `${v.name} insurance expires within 30 days.`,
          dueDate: date,
        });
    }
    const spend = maintenanceCostByVehicle[v.id] || 0;
    if (v.acquisitionCost > 0 && spend > v.acquisitionCost * 0.05)
      alerts.push({
        severity: "INFO",
        entityType: "Vehicle",
        entityId: v.id,
        message: `${v.name} maintenance spend ₹${Math.round(spend).toLocaleString("en-IN")} is high relative to acquisition cost.`,
        dueDate: null,
      });
  }

  for (const m of maintenance) {
    if (m.status === "SCHEDULED" && daysTo(m.scheduledDate) < 0)
      alerts.push({
        severity: "WARNING",
        entityType: "Maintenance",
        entityId: m.id,
        message: `Scheduled maintenance for ${m.vehicleName} is overdue.`,
        dueDate: m.scheduledDate,
      });
  }

  for (const t of trips) {
    if (t.status !== "CANCELLED" && t.estimatedMargin < 0)
      alerts.push({
        severity: "WARNING",
        entityType: "Trip",
        entityId: t.id,
        message: `Trip ${t.tripNumber} has a negative estimated margin.`,
        dueDate: null,
      });
    if (
      t.status === "COMPLETED" &&
      t.actualFuelConsumed &&
      t.actualFuelConsumed > 0 &&
      t.plannedDistance / t.actualFuelConsumed < 4
    )
      alerts.push({
        severity: "INFO",
        entityType: "Trip",
        entityId: t.id,
        message: `Trip ${t.tripNumber} recorded low fuel efficiency (${Math.round((t.plannedDistance / t.actualFuelConsumed) * 10) / 10} km/L).`,
        dueDate: null,
      });
  }

  return alerts;
}
