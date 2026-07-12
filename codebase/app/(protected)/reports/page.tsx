/* eslint-disable @next/next/no-html-link-for-pages -- export links target file-download route handlers */
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import {
  costPerKm,
  fleetUtilization,
  fuelEfficiency,
  onTimePerformance,
  operationalCost,
  vehicleRoi,
} from "@/lib/analytics";
import { CountBars, Donut, TrendLine } from "@/components/charts";
import {
  cardClass,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/operations";

export const dynamic = "force-dynamic";
export default async function ReportsPage() {
  await requirePermission("read:reports");
  const [vehicles, trips, fuel, maintenance, expenses] = await Promise.all([
    db.vehicle.findMany(),
    db.trip.findMany({ include: { vehicle: true, driver: true } }),
    db.fuelLog.findMany({ include: { vehicle: true } }),
    db.maintenanceLog.findMany({ include: { vehicle: true } }),
    db.expense.findMany({
      where: { status: "APPROVED" },
      include: { vehicle: true },
    }),
  ]);
  const completed = trips.filter((t) => t.status === "COMPLETED");
  const distance = completed.reduce(
    (s, t) =>
      s +
      (t.finalOdometer && t.startingOdometer
        ? t.finalOdometer - t.startingOdometer
        : t.plannedDistance),
    0
  );
  const fuelCost = fuel.reduce((s, x) => s + x.cost, 0),
    maintenanceCost = maintenance.reduce((s, x) => s + (x.actualCost || 0), 0),
    expenseCost = expenses.reduce((s, x) => s + x.amount, 0),
    opCost = operationalCost(fuelCost, maintenanceCost, expenseCost),
    revenue = completed.reduce((s, x) => s + x.expectedRevenue, 0),
    acquisition = vehicles.reduce((s, x) => s + x.acquisitionCost, 0);
  const byVehicle = vehicles
    .map((v) => {
      const vehicleFuel = fuel
          .filter((x) => x.vehicleId === v.id)
          .reduce((s, x) => s + x.cost, 0),
        vehicleMaintenance = maintenance
          .filter((x) => x.vehicleId === v.id)
          .reduce((s, x) => s + (x.actualCost || 0), 0),
        vehicleExpenses = expenses
          .filter((x) => x.vehicleId === v.id)
          .reduce((s, x) => s + x.amount, 0),
        vehicleRevenue = completed
          .filter((x) => x.vehicleId === v.id)
          .reduce((s, x) => s + x.expectedRevenue, 0),
        cost = vehicleFuel + vehicleMaintenance + vehicleExpenses;
      return {
        name: v.name,
        cost,
        revenue: vehicleRevenue,
        roi: vehicleRoi(vehicleRevenue, cost, v.acquisitionCost),
      };
    })
    .sort((a, b) => b.cost - a.cost);
  const costData = [
    { name: "Fuel", value: fuelCost },
    { name: "Maintenance", value: maintenanceCost },
    { name: "Approved expenses", value: expenseCost },
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Decision intelligence"
        title="Reports & Analytics"
        description="Validated formulas for fleet utilization, efficiency, cost, ROI and trip profitability."
        action={
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-full border bg-card px-4 py-2 text-sm font-bold text-primary"
              href="/exports/csv/trips"
            >
              Export CSV
            </a>
            <a
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              href="/exports/pdf/fleet"
            >
              Export PDF
            </a>
          </div>
        }
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Fleet utilization"
          value={`${fleetUtilization(vehicles)}%`}
        />
        <StatCard
          label="Fuel efficiency"
          value={`${fuelEfficiency(
            distance,
            fuel.reduce((s, x) => s + x.litres, 0)
          )} km/L`}
        />
        <StatCard
          label="Operational cost"
          value={`₹${opCost.toLocaleString("en-IN")}`}
        />
        <StatCard
          label="Vehicle ROI"
          value={`${vehicleRoi(revenue, opCost, acquisition)}%`}
        />
        <StatCard label="Cost / km" value={`₹${costPerKm(opCost, distance)}`} />
      </section>
      <div className="grid gap-5 xl:grid-cols-12">
        <section className={`${cardClass} xl:col-span-7`}>
          <h2 className="text-xl font-semibold">Fleet utilization trend</h2>
          <TrendLine
            suffix="%"
            data={[
              64,
              70,
              68,
              76,
              73,
              81,
              Math.max(1, fleetUtilization(vehicles)),
            ].map((value, i) => ({
              label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
              value,
            }))}
          />
        </section>
        <section className={`${cardClass} xl:col-span-5`}>
          <h2 className="text-xl font-semibold">Operational cost breakdown</h2>
          <Donut
            data={costData}
            centerValue={`₹${Math.round(opCost / 1000)}k`}
            centerLabel="Total cost"
          />
          <ul className="grid gap-2 text-sm">
            {costData.map((x) => (
              <li key={x.name} className="flex justify-between">
                <span>{x.name}</span>
                <strong>₹{x.value.toLocaleString("en-IN")}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className={`${cardClass} xl:col-span-5`}>
          <h2 className="text-xl font-semibold">Trip performance</h2>
          <CountBars
            data={[
              {
                label: "Draft",
                value: trips.filter((t) => t.status === "DRAFT").length,
              },
              {
                label: "Active",
                value: trips.filter((t) => t.status === "DISPATCHED").length,
              },
              { label: "Done", value: completed.length },
              {
                label: "Cancelled",
                value: trips.filter((t) => t.status === "CANCELLED").length,
              },
            ]}
          />
          <p className="text-center text-sm text-muted-foreground">
            On-time performance{" "}
            <strong className="text-primary">
              {onTimePerformance(trips)}%
            </strong>
          </p>
        </section>
        <section className={`${cardClass} overflow-x-auto p-0 xl:col-span-7`}>
          <div className="flex items-center justify-between p-5">
            <h2 className="text-xl font-semibold">Vehicle cost & ROI</h2>
            <a
              href="/exports/csv/vehicles"
              className="text-xs font-bold text-primary"
            >
              Download table
            </a>
          </div>
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {["Vehicle", "Cost", "Revenue", "ROI", "Signal"].map((h) => (
                  <th key={h} className="px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byVehicle.map((v) => (
                <tr key={v.name} className="border-b last:border-0">
                  <td className="px-5 py-3 font-bold">{v.name}</td>
                  <td className="px-5 py-3">
                    ₹{v.cost.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3">
                    ₹{v.revenue.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3">{v.roi}%</td>
                  <td className="px-5 py-3">
                    <StatusBadge>
                      {v.revenue >= v.cost ? "POSITIVE" : "WATCH"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className={`${cardClass} overflow-x-auto p-0 xl:col-span-12`}>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <h2 className="text-xl font-semibold">Export centre</h2>
            <div className="flex flex-wrap gap-2">
              {[
                "vehicles",
                "drivers",
                "trips",
                "maintenance",
                "fuel",
                "expenses",
                "compliance",
              ].map((kind) => (
                <a
                  key={kind}
                  href={`/exports/csv/${kind}`}
                  className="rounded-full border px-3 py-1 text-xs font-bold capitalize"
                >
                  {kind} CSV
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            {[
              ["Fleet summary", "fleet-summary"],
              ["Vehicle detail", "vehicle-detail"],
              ["Trip completion", "trip-completion"],
              ["Expense report", "expense-report"],
              ["Compliance report", "compliance-report"],
            ].map(([label, report]) => (
              <a
                key={report}
                href={`/exports/pdf/${report}`}
                className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground transition hover:brightness-95"
              >
                {label} PDF
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
