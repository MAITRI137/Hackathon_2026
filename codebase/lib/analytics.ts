export type VehicleLite = { status: string };
export type TripLite = {
  status: string;
  plannedDistance: number;
  expectedRevenue: number;
  estimatedMargin: number;
  actualCompletion?: Date | null;
  plannedCompletion: Date;
};

/** ON_TRIP vehicles / active non-retired vehicles × 100 */
export function fleetUtilization(vehicles: VehicleLite[]) {
  const active = vehicles.filter((v) => v.status !== "RETIRED");
  if (!active.length) return 0;
  return Math.round(
    (active.filter((v) => v.status === "ON_TRIP").length / active.length) * 100
  );
}

/** completed distance / fuel litres (km per litre) */
export function fuelEfficiency(completedDistanceKm: number, litres: number) {
  return litres > 0 ? Math.round((completedDistanceKm / litres) * 10) / 10 : 0;
}

/** fuel + maintenance + approved expenses */
export function operationalCost(
  fuelCost: number,
  maintenanceCost: number,
  approvedExpenses: number
) {
  return Math.round(fuelCost + maintenanceCost + approvedExpenses);
}

/** (revenue - operational cost) / acquisition cost */
export function vehicleRoi(
  revenue: number,
  opCost: number,
  acquisitionCost: number
) {
  return acquisitionCost > 0
    ? Math.round(((revenue - opCost) / acquisitionCost) * 1000) / 10
    : 0;
}

/** operational cost / completed distance */
export function costPerKm(opCost: number, completedDistanceKm: number) {
  return completedDistanceKm > 0
    ? Math.round((opCost / completedDistanceKm) * 100) / 100
    : 0;
}

/** % of completed trips finished on or before the planned completion */
export function onTimePerformance(trips: TripLite[]) {
  const completed = trips.filter(
    (t) => t.status === "COMPLETED" && t.actualCompletion
  );
  if (!completed.length) return 100;
  const onTime = completed.filter(
    (t) => (t.actualCompletion as Date) <= t.plannedCompletion
  ).length;
  return Math.round((onTime / completed.length) * 100);
}

/** counts per day label for the trailing `days` days */
export function tripsByDay(
  trips: { plannedStart: Date }[],
  days = 7,
  now = new Date()
) {
  const out: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86_400_000);
    const label = day.toLocaleDateString("en-IN", { weekday: "short" });
    const value = trips.filter(
      (t) => t.plannedStart.toDateString() === day.toDateString()
    ).length;
    out.push({ label, value });
  }
  return out;
}
