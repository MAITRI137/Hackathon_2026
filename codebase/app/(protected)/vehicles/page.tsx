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
import { createVehicle, deleteDocument, retireVehicle, uploadDocument } from "../actions";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    message?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await requirePermission("read:vehicles");
  const q = params?.q?.trim() || "";
  const status = params?.status || "";
  const vehicles = await db.vehicle.findMany({
    where: {
      ...(status && { status }),
      ...(q && {
        OR: [
          { name: { contains: q } },
          { registrationNumber: { contains: q } },
          { type: { contains: q } },
        ],
      }),
    },
    orderBy: { name: "asc" },
    include: { documents: { include: { file: true } }, _count: { select: { trips: true, maintenanceLogs: true } } },
  });
  const canManage = hasPermission(user, "manage:vehicles");
  return (
    <div>
      <PageHeader
        eyebrow="Fleet master data"
        title="Vehicle Registry"
        description="Every asset, document deadline, trip and service record in one operational view."
        action={
          canManage && (
            <details className={cardClass}>
              <summary className="cursor-pointer font-bold text-primary">
                + Add vehicle
              </summary>
              <form
                action={createVehicle}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                {[
                  ["registrationNumber", "Registration number"],
                  ["name", "Vehicle name"],
                  ["manufacturer", "Manufacturer"],
                  ["model", "Model"],
                  ["type", "Type"],
                  ["region", "Region"],
                  ["maxLoadCapacity", "Capacity (kg)"],
                  ["odometer", "Odometer"],
                ].map(([name, label]) => (
                  <label key={name} className="grid gap-1 text-xs font-bold">
                    {label}
                    <input
                      name={name}
                      type={
                        name === "maxLoadCapacity" || name === "odometer"
                          ? "number"
                          : "text"
                      }
                      required
                      className={fieldClass}
                    />
                  </label>
                ))}
                <input type="hidden" name="status" value="AVAILABLE" />
                <button className={`${buttonClass} sm:col-span-2`}>
                  Save vehicle
                </button>
              </form>
            </details>
          )
        }
      />
      {(params?.message || params?.error) && (
        <p
          role="status"
          className={`mb-4 rounded-2xl p-3 text-sm ${params.error ? "bg-red-100 text-red-800" : "bg-primary/10 text-primary"}`}
        >
          {params.message || params.error}
        </p>
      )}
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total vehicles" value={vehicles.length} />
        <StatCard
          label="Available"
          value={vehicles.filter((v) => v.status === "AVAILABLE").length}
        />
        <StatCard
          label="On trip"
          value={vehicles.filter((v) => v.status === "ON_TRIP").length}
        />
        <StatCard
          label="In shop"
          value={vehicles.filter((v) => v.status === "IN_SHOP").length}
        />
      </section>
      <form className="mb-4 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search vehicles..."
          className={`${fieldClass} min-w-64`}
        />
        <select name="status" defaultValue={status} className={fieldClass}>
          <option value="">All statuses</option>
          {["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className={buttonClass}>Filter</button>
      </form>
      <div className={`${cardClass} overflow-x-auto p-0`}>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {[
                "Vehicle",
                "Type / Region",
                "Capacity",
                "Odometer",
                "Acquisition",
                "Compliance",
                "Activity",
                "Status",
                canManage ? "Action" : "",
              ].map((h) => (
                <th key={h} className="px-5 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr
                key={v.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-5 py-4">
                  <strong>{v.name}</strong>
                  <span className="block text-xs text-muted-foreground">
                    {v.registrationNumber}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {v.type}
                  <span className="block text-xs text-muted-foreground">
                    {v.region}
                  </span>
                </td>
                <td className="px-5 py-4 tabular-nums">
                  {v.maxLoadCapacity.toLocaleString()} kg
                </td>
                <td className="px-5 py-4 tabular-nums">
                  {v.odometer.toLocaleString()} km
                </td>
                <td className="px-5 py-4">
                  ₹{v.acquisitionCost.toLocaleString("en-IN")}
                </td>
                <td className="px-5 py-4 text-xs">
                  Insurance {v.insuranceExpiry.toLocaleDateString("en-IN")}
                </td>
                <td className="px-5 py-4 text-xs">
                  {v._count.trips} trips · {v._count.maintenanceLogs} services
                  {v.documents.map(document=><span key={document.id} className="mt-1 flex gap-1"><a className="text-primary" href={`/files/${document.fileId}`}>{document.type}</a>{canManage&&<form action={deleteDocument}><input type="hidden" name="entityType" value="vehicle"/><input type="hidden" name="fileId" value={document.fileId}/><button aria-label={`Delete ${document.type}`}>×</button></form>}</span>)}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge>{v.status}</StatusBadge>
                </td>
                {canManage && (
                  <td className="px-5 py-4">
                    <details className="mb-2"><summary className="cursor-pointer text-xs font-bold text-primary">Document</summary><form action={uploadDocument} className="mt-2 grid w-56 gap-2"><input type="hidden" name="entityType" value="vehicle"/><input type="hidden" name="entityId" value={v.id}/><input name="type" required placeholder="Insurance / Permit" className="rounded-full border px-3 py-1 text-xs"/><input name="expiresAt" type="date" className="rounded-full border px-3 py-1 text-xs"/><input name="file" type="file" accept="application/pdf,image/png,image/jpeg" required className="text-xs"/><button className="text-left text-xs font-bold text-primary">Upload</button></form></details>
                    {v.status !== "RETIRED" && (
                      <form action={retireVehicle}>
                        <input type="hidden" name="id" value={v.id} />
                        <button className="text-xs font-bold text-destructive-foreground">
                          Retire
                        </button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
