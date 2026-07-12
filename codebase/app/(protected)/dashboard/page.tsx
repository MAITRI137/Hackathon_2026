import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import {
  fleetUtilization,
  fuelEfficiency,
  onTimePerformance,
  operationalCost,
  tripsByDay,
} from "@/lib/analytics";
import { CountBars, Donut, DonutLegend, TrendLine } from "@/components/charts";
import {
  cardClass,
  fieldClass,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/operations";

export const dynamic = "force-dynamic";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ region?: string; status?: string }>;
}) {
  await requirePermission("read:dashboard");
  const params = await searchParams;
  const [vehicles, trips, drivers, maintenance, fuel, expenses, alerts] =
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
      db.complianceAlert.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 5,
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
  return (
    <div>
      <PageHeader
        eyebrow="Operations control centre"
        title="Dashboard"
        description="Fleet health, live work and cost signals in one calm operational surface."
        action={
          <form className="flex gap-2">
            <select
              name="region"
              defaultValue={params?.region || ""}
              className={fieldClass}
            >
              <option value="">All regions</option>
              {["West", "North", "South"].map((x) => (
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
          </form>
        }
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fleet utilization"
          value={`${fleetUtilization(vehicles)}%`}
          detail="Active non-retired fleet"
        />
        <StatCard
          label="Active trips"
          value={trips.filter((t) => t.status === "DISPATCHED").length}
          detail={`${trips.filter((t) => t.status === "DRAFT").length} drafts ready`}
        />
        <StatCard
          label="On-time performance"
          value={`${onTimePerformance(trips)}%`}
        />
        <StatCard
          label="Operational cost"
          value={`₹${cost.toLocaleString("en-IN")}`}
          detail={`${fuelEfficiency(distance, litres)} km/L fleet efficiency`}
        />
      </section>
      <div className="grid gap-5 xl:grid-cols-12">
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
        <section className={`${cardClass} xl:col-span-4`}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Demand rhythm
          </p>
          <h2 className="text-xl font-semibold">Trips by day</h2>
          <CountBars data={tripsByDay(trips)} />
        </section>
        <section className={`${cardClass} xl:col-span-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent trips</h2>
            <a href="/trips" className="text-xs font-bold text-primary">
              View all
            </a>
          </div>
          <ul className="mt-4 divide-y">
            {trips.slice(0, 5).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <strong>
                    {t.source} → {t.destination}
                  </strong>
                  <span className="block text-xs text-muted-foreground">
                    {t.tripNumber} · {t.driver?.name || "Unassigned"}
                  </span>
                </div>
                <StatusBadge>{t.status}</StatusBadge>
              </li>
            ))}
          </ul>
        </section>
        <section className={`${cardClass} xl:col-span-3`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Compliance</h2>
            <a href="/compliance" className="text-xs font-bold text-primary">
              Open centre
            </a>
          </div>
          <ul className="mt-4 space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-2xl bg-muted p-3 text-xs">
                <StatusBadge>{a.severity}</StatusBadge>
                <p className="mt-2">{a.message}</p>
              </li>
            ))}
            {!alerts.length && (
              <li className="text-sm text-muted-foreground">No open alerts.</li>
            )}
          </ul>
        </section>
        <section className={`${cardClass} xl:col-span-7`}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Route overview
          </p>
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="relative mt-3 min-h-44 overflow-hidden rounded-[1.5rem] bg-[#e8eadf] dark:bg-[#182016]">
              <svg viewBox="0 0 500 180" className="h-full w-full">
                <path
                  d="M40 135 C140 30 300 155 455 42"
                  fill="none"
                  stroke="#5D7052"
                  strokeWidth="6"
                  strokeDasharray="10 8"
                />
                <circle cx="40" cy="135" r="9" fill="#5D7052" />
                <circle cx="455" cy="42" r="9" fill="#C18C5D" />
              </svg>
            </div>
            <div className="pt-5">
              <h2 className="text-xl font-semibold">Mumbai → Pune</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                148 km · 3h 10m
              </p>
              <StatusBadge>DEMO ROUTE</StatusBadge>
            </div>
          </div>
        </section>
        <section className={`${cardClass} xl:col-span-5`}>
          <h2 className="text-xl font-semibold">Maintenance health</h2>
          <div className="mt-5 flex items-center gap-5">
            <div className="grid h-28 w-28 place-items-center rounded-full border-[12px] border-primary/25 text-2xl font-bold">
              {Math.max(
                0,
                100 -
                  maintenance.filter((m) => m.status === "IN_PROGRESS").length *
                    8
              )}
              %
            </div>
            <div>
              <p className="font-bold text-primary">Good</p>
              <p className="text-sm text-muted-foreground">
                {maintenance.filter((m) => m.status === "SCHEDULED").length}{" "}
                upcoming ·{" "}
                {maintenance.filter((m) => m.status === "IN_PROGRESS").length}{" "}
                active
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
