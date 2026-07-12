import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import {
  buttonClass,
  cardClass,
  fieldClass,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/operations";
import {
  completeMaintenance,
  scheduleMaintenance,
  startMaintenance,
} from "../actions";

export const dynamic = "force-dynamic";
export default async function MaintenancePage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await requirePermission("read:maintenance");
  const canManage = hasPermission(user, "manage:maintenance");
  const [logs, vehicles] = await Promise.all([
    db.maintenanceLog.findMany({
      include: { vehicle: true, invoiceFile: true },
      orderBy: { scheduledDate: "desc" },
    }),
    db.vehicle.findMany({
      where: { status: { not: "RETIRED" } },
      orderBy: { name: "asc" },
    }),
  ]);
  const active = logs.filter((l) => l.status === "IN_PROGRESS");
  return (
    <div>
      <PageHeader
        eyebrow="Workshop control"
        title="Maintenance"
        description="Schedule work, reserve vehicles and return serviced assets to dispatch safely."
        action={
          canManage && (
            <details className={cardClass}>
              <summary className="cursor-pointer font-bold text-primary">
                + Add work order
              </summary>
              <form
                action={scheduleMaintenance}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <label className="grid gap-1 text-xs font-bold">
                  Vehicle
                  <select name="vehicleId" className={fieldClass}>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · {v.status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold">
                  Service type
                  <input name="serviceType" required className={fieldClass} />
                </label>
                <label className="grid gap-1 text-xs font-bold">
                  Scheduled date
                  <input
                    name="scheduledDate"
                    type="date"
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold">
                  Odometer
                  <input
                    name="odometer"
                    type="number"
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold">
                  Vendor
                  <input name="vendor" className={fieldClass} />
                </label>
                <label className="grid gap-1 text-xs font-bold">
                  Estimate
                  <input
                    name="estimatedCost"
                    type="number"
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold">
                  Priority
                  <select name="priority" className={fieldClass}>
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold sm:col-span-2">
                  Description
                  <input name="description" required className={fieldClass} />
                </label>
                <button className={`${buttonClass} sm:col-span-2`}>
                  Schedule maintenance
                </button>
              </form>
            </details>
          )
        }
      />
      {(params?.message || params?.error) && (
        <p
          className={`mb-4 rounded-2xl p-3 text-sm ${params.error ? "bg-red-100 text-red-800" : "bg-primary/10 text-primary"}`}
        >
          {params.message || params.error}
        </p>
      )}
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Scheduled"
          value={logs.filter((l) => l.status === "SCHEDULED").length}
        />
        <StatCard label="In progress" value={active.length} />
        <StatCard
          label="Completed"
          value={logs.filter((l) => l.status === "COMPLETED").length}
        />
        <StatCard
          label="Maintenance health"
          value={`${Math.max(0, 100 - active.length * 8)}%`}
          detail="Available fleet service readiness"
        />
      </section>
      <div className="grid gap-4 xl:grid-cols-3">
        {logs.map((log) => (
          <article key={log.id} className={cardClass}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {log.vehicle.registrationNumber}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {log.vehicle.name}
                </h2>
              </div>
              <StatusBadge>{log.status}</StatusBadge>
            </div>
            <h3 className="mt-5 font-bold">{log.serviceType}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {log.description}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Scheduled</dt>
                <dd className="font-bold">
                  {log.scheduledDate.toLocaleDateString("en-IN")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Priority</dt>
                <dd className="font-bold">{log.priority}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Vendor</dt>
                <dd className="font-bold">{log.vendor || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cost</dt>
                <dd className="font-bold">
                  ₹
                  {(log.actualCost ?? log.estimatedCost).toLocaleString(
                    "en-IN"
                  )}
                </dd>
              </div>
            </dl>
            {canManage && (
              <div className="mt-5">
                {log.status === "SCHEDULED" && (
                  <form action={startMaintenance}>
                    <input type="hidden" name="id" value={log.id} />
                    <button className={buttonClass}>Start work</button>
                  </form>
                )}
                {log.status === "IN_PROGRESS" && (
                  <form action={completeMaintenance} className="flex gap-2">
                    <input type="hidden" name="id" value={log.id} />
                    <input
                      name="actualCost"
                      type="number"
                      required
                      placeholder="Actual cost"
                      className={`${fieldClass} min-w-0`}
                    />
                    <button className={buttonClass}>Complete</button>
                  </form>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
