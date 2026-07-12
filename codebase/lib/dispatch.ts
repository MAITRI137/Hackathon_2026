export type DispatchVehicle = { id: string; name: string; status: string; type: string; maxLoadCapacity: number; fuelEfficiency: number; documentsValid: boolean; maintenanceHealthy: boolean };
export type DispatchDriver = { id: string; name: string; status: string; licenceCategory: string; licenceExpiry: Date; safetyScore: number };
export type DispatchRequest = { cargoWeight: number; distanceKm: number; expectedRevenue: number; plannedCompletion: Date };

const categoryMatches = (category: string, type: string) => type.toLowerCase().includes("truck") || type.toLowerCase().includes("bus") ? category === "HMV" : ["LMV", "HMV"].includes(category);

export function recommendDispatch(request: DispatchRequest, vehicles: DispatchVehicle[], drivers: DispatchDriver[]) {
  const rejected: string[] = [];
  const eligibleVehicles = vehicles.filter((vehicle) => {
    const reasons = [vehicle.status !== "AVAILABLE" && (vehicle.status === "IN_SHOP" ? "is in maintenance" : vehicle.status === "RETIRED" ? "is retired" : "is already on an active trip"), vehicle.maxLoadCapacity < request.cargoWeight && `supports ${vehicle.maxLoadCapacity} kg, below the ${request.cargoWeight} kg cargo`, !vehicle.documentsValid && "has expired documents", !vehicle.maintenanceHealthy && "has critical maintenance due"].filter(Boolean);
    if (reasons.length) rejected.push(`${vehicle.name}: ${reasons.join("; ")}.`);
    return !reasons.length;
  });
  const eligibleDrivers = drivers.filter((driver) => {
    const reasons = [driver.status !== "AVAILABLE" && (driver.status === "SUSPENDED" ? "is suspended" : driver.status === "ON_TRIP" ? "is already on an active trip" : "is off duty"), driver.licenceExpiry < request.plannedCompletion && "licence is expired before trip completion"].filter(Boolean);
    if (reasons.length) rejected.push(`${driver.name}: ${reasons.join("; ")}.`);
    return !reasons.length;
  });
  const options = eligibleVehicles.flatMap((vehicle) => eligibleDrivers.filter((driver) => {
    if (!categoryMatches(driver.licenceCategory, vehicle.type)) { rejected.push(`${driver.name}: licence category does not match ${vehicle.name}.`); return false; }
    return true;
  }).map((driver) => {
    const estimatedFuelCost = Math.round((request.distanceKm / vehicle.fuelEfficiency) * 105);
    const breakEvenRevenue = Math.round(estimatedFuelCost + request.distanceKm * 9);
    const capacityFit = request.cargoWeight / vehicle.maxLoadCapacity;
    const score = Math.max(0, Math.min(100, Math.round(45 + capacityFit * 20 + driver.safetyScore * .25 + Math.max(0, 12 - estimatedFuelCost / 1000))));
    return { vehicle, driver, score, estimatedFuelCost, breakEvenRevenue, estimatedMargin: request.expectedRevenue - breakEvenRevenue, reasons: [`Cargo uses ${Math.round(capacityFit * 100)}% of capacity`, `Safety score ${driver.safetyScore}`, "Documents and maintenance checks passed", `Estimated fuel ₹${estimatedFuelCost.toLocaleString("en-IN")}`] };
  })).sort((a, b) => b.score - a.score || b.estimatedMargin - a.estimatedMargin);
  return { best: options[0] ?? null, alternatives: options.slice(1, 4), rejected };
}

export function dispatchProblems(request: DispatchRequest, vehicle: DispatchVehicle, driver: DispatchDriver) {
  const result = recommendDispatch(request, [vehicle], [driver]);
  return result.best ? [] : result.rejected;
}
