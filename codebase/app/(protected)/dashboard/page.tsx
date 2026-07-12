import Form from "next/form";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import {
  fleetUtilization,
  fuelEfficiency,
  onTimePerformance,
  operationalCost,
  tripsByDay,
} from "@/lib/analytics";
import {
  CountBars,
  Donut,
  DonutLegend,
  TrendLine,
  HalfDonut,
} from "@/components/charts";
import {
  cardClass,
  fieldClass,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/operations";
import { DashboardMap } from "./dashboard-map";

export const dynamic = "force-dynamic";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ region?: string; status?: string }>;
}) {
  await requirePermission("read:dashboard");
  const params = await searchParams;
  const [vehicles, trips, drivers, maintenance, fuel, expenses] =
    await Promise.all([
      db.vehicle.findMany({
        where: {
          ...(params?.region && { region: params.region }),
          ...(params?.status && { status: params.status }),
        },
      }),
      db.trip.findMany({
        include: { vehicle: true, driver: true },
        orderBy: { createdAt: "desc" },
      }),
      db.driver.findMany(),
      db.maintenanceLog.findMany(),
      db.fuelLog.findMany(),
      db.expense.findMany({ where: { status: "APPROVED" } }),
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
  const litres = fuel.reduce((s, f) => s + f.litres, 0);
  const cost = operationalCost(
    fuel.reduce((s, f) => s + f.cost, 0),
    maintenance.reduce((s, m) => s + (m.actualCost || 0), 0),
    expenses.reduce((s, e) => s + e.amount, 0)
  );
  const statusData = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"].map(
    (name) => ({
      name: name.replaceAll("_", " "),
      value: vehicles.filter((v) => v.status === name).length,
    })
  );

  // Prepare active route data for the map
  const activeTrips = trips
    .filter((t) => t.status === "DISPATCHED" && t.sourceLat && t.destinationLat)
    .slice(0, 8)
    .map((t) => ({
      source: [t.sourceLat!, t.sourceLng!] as [number, number],
      destination: [t.destinationLat!, t.destinationLng!] as [number, number],
      label: `${t.source} → ${t.destination}`,
    }));

  // Also show last few completed routes for context
  const recentCompleted = completed
    .filter((t) => t.sourceLat && t.destinationLat)
    .slice(0, 4)
    .map((t) => ({
      source: [t.sourceLat!, t.sourceLng!] as [number, number],
      destination: [t.destinationLat!, t.destinationLng!] as [number, number],
      label: `${t.source} → ${t.destination}`,
      color: "#888",
    }));

  const mapRoutes = [...activeTrips, ...recentCompleted];

  return (
    <div>
      <PageHeader
        eyebrow="Operations control centre"
        title="Dashboard"
        description="Fleet health, live work and cost signals in one calm operational surface."
        action={
          <Form action="" className="flex gap-2">
            <select
              name="region"
              defaultValue={params?.region || ""}
              className={fieldClass}
            >
              <option value="">All regions</option>
              {["West", "North", "South", "East"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={params?.status || ""}
              className={fieldClass}
            >
              <option value="">All statuses</option>
              {["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <button className="rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground">
              Apply
            </button>
          </Form>
        }
      />

      {/* KPI Strip — matches PDF wireframe row of stat tiles */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total vehicles"
          value={vehicles.length}
          detail={`${vehicles.filter((v) => v.status !== "RETIRED").length} active`}
          seed={0}
        />
        <StatCard
          label="Available"
          value={vehicles.filter((v) => v.status === "AVAILABLE").length}
          seed={1}
        />
        <StatCard
          label="On trip"
          value={vehicles.filter((v) => v.status === "ON_TRIP").length}
          seed={2}
        />
        <StatCard
          label="In maintenance"
          value={vehicles.filter((v) => v.status === "IN_SHOP").length}
          seed={3}
        />
        <StatCard
          label="Active trips"
          value={trips.filter((t) => t.status === "DISPATCHED").length}
          seed={0}
        />
        <StatCard
          label="Pending trips"
          value={trips.filter((t) => t.status === "DRAFT").length}
          seed={1}
        />
        <StatCard
          label="Drivers on duty"
          value={
            drivers.filter(
              (d) => d.status === "AVAILABLE" || d.status === "ON_TRIP"
            ).length
          }
          detail={`${drivers.length} total`}
          seed={2}
        />
        <StatCard
          label="On-time rate"
          value={`${onTimePerformance(trips)}%`}
          seed={3}
        />
        <StatCard
          label="Fleet utilization"
          value={`${fleetUtilization(vehicles)}%`}
          detail="Active non-retired fleet"
          seed={0}
        />
        <StatCard
          label="Fuel efficiency"
          value={`${fuelEfficiency(distance, litres)} km/L`}
          seed={1}
        />
        <StatCard
          label="Total distance"
          value={`${distance.toLocaleString("en-IN")} km`}
          seed={2}
        />
        <StatCard
          label="Operational cost"
          value={`₹${cost.toLocaleString("en-IN")}`}
          seed={3}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        {/* Route Map — real Leaflet tiles */}
        <section className={`${cardClass} xl:col-span-7`}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Route overview
          </p>
          <h2 className="mb-3 text-xl font-semibold">Active routes</h2>
          <DashboardMap routes={mapRoutes} />
          <p className="mt-2 text-xs text-muted-foreground">
            {activeTrips.length} active · {recentCompleted.length} recent
            completed
          </p>
        </section>

        {/* Vehicle Status Donut */}
        <section className={`${cardClass} xl:col-span-5`}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Live fleet
          </p>
          <h2 className="text-xl font-semibold">Vehicle status</h2>
          <div className="grid items-center sm:grid-cols-2">
            <Donut
              data={statusData}
              centerValue={String(vehicles.length)}
              centerLabel="Vehicles"
            />
            <DonutLegend data={statusData} />
          </div>
        </section>

        {/* Trips Trend */}
        <section className={`${cardClass} xl:col-span-7`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Fleet performance
              </p>
              <h2 className="text-xl font-semibold">
                Trips completed this week
              </h2>
            </div>
            <StatusBadge>{onTimePerformance(trips)}% ON TIME</StatusBadge>
          </div>
          <TrendLine
            data={tripsByDay(
              completed.map((t) => ({ plannedStart: t.plannedStart }))
            )}
          />
        </section>

        {/* Trips by Day */}
        <section className={`${cardClass} xl:col-span-5`}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Demand rhythm
          </p>
          <h2 className="text-xl font-semibold">Trips by day</h2>
          <CountBars data={tripsByDay(trips)} />
        </section>

        {/* Recent Trips */}
        <section className={`${cardClass} xl:col-span-7`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent trips</h2>
            <a href="/trips" className="text-xs font-bold text-primary">
              View all
            </a>
          </div>
          <ul className="mt-4 divide-y divide-border/50">
            {trips.slice(0, 6).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <strong className="block truncate">
                    {t.source} → {t.destination}
                  </strong>
                  <span className="block text-xs text-muted-foreground">
                    {t.tripNumber} · {t.driver?.name || "Unassigned"} ·{" "}
                    {t.vehicle?.name || "—"}
                  </span>
                </div>
                <StatusBadge>{t.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </section>

        {/* Maintenance Health */}
        <section className={`${cardClass} xl:col-span-5`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Vehicle fitness
              </p>
              <h2 className="text-xl font-semibold">Maintenance health</h2>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">Good</p>
              <p className="text-xs text-muted-foreground">
                {maintenance.filter((m) => m.status === "SCHEDULED").length}{" "}
                upcoming
                <br />
                {
                  maintenance.filter((m) => m.status === "IN_PROGRESS").length
                }{" "}
                active
              </p>
            </div>
          </div>

          <HalfDonut
            data={[
              {
                name: "Healthy",
                value: Math.max(
                  0,
                  100 -
                    maintenance.filter((m) => m.status === "IN_PROGRESS")
                      .length *
                      8
                ),
                color: "#5D7052",
              },
              {
                name: "In Shop",
                value: Math.min(
                  100,
                  maintenance.filter((m) => m.status === "IN_PROGRESS").length *
                    8
                ),
                color: "#DED8CF",
              },
            ]}
            centerValue={`${Math.max(0, 100 - maintenance.filter((m) => m.status === "IN_PROGRESS").length * 8)}%`}
            centerLabel="Health Score"
          />
        </section>
      </div>
    </div>
  );
}
