import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { driverCompliance } from "@/lib/fleet";
import {
  buttonClass,
  cardClass,
  fieldClass,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/operations";
import { PersonAvatar } from "@/components/botanics";
import {
  createDriver,
  deleteDocument,
  setDriverStatus,
  uploadDocument,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function DriversPage({
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
  const user = await requirePermission("read:drivers");
  const q = params?.q?.trim() || "";
  const status = params?.status || "";
  const drivers = await db.driver.findMany({
    where: {
      ...(status && { status }),
      ...(q && {
        OR: [
          { name: { contains: q } },
          { licenceNumber: { contains: q } },
          { employeeId: { contains: q } },
        ],
      }),
    },
    orderBy: { name: "asc" },
    include: {
      documents: { include: { file: true } },
      _count: { select: { trips: true } },
    },
  });
  const canManage = hasPermission(user, "manage:drivers");
  return (
    <div>
      <PageHeader
        eyebrow="People and safety"
        title="Drivers & Safety"
        description="Licence readiness, duty state and safety performance for every driver."
        action={
          canManage && (
            <details className={cardClass}>
              <summary className="cursor-pointer font-bold text-primary">
                + Add driver
              </summary>
              <form
                action={createDriver}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                {[
                  ["name", "Name"],
                  ["employeeId", "Employee ID"],
                  ["licenceNumber", "Licence number"],
                  ["licenceCategory", "Category"],
                  ["licenceExpiry", "Licence expiry"],
                  ["contactNumber", "Contact number"],
                  ["region", "Region"],
                  ["safetyScore", "Safety score"],
                ].map(([name, label]) => (
                  <label key={name} className="grid gap-1 text-xs font-bold">
                    {label}
                    <input
                      name={name}
                      required
                      type={
                        name === "licenceExpiry"
                          ? "date"
                          : name === "safetyScore"
                            ? "number"
                            : "text"
                      }
                      className={fieldClass}
                    />
                  </label>
                ))}
                <input type="hidden" name="status" value="AVAILABLE" />
                <button className={`${buttonClass} sm:col-span-2`}>
                  Save driver
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
        <StatCard label="Drivers" value={drivers.length} />
        <StatCard
          label="Available"
          value={drivers.filter((d) => d.status === "AVAILABLE").length}
        />
        <StatCard
          label="On trip"
          value={drivers.filter((d) => d.status === "ON_TRIP").length}
        />
        <StatCard
          label="Safety average"
          value={`${Math.round(drivers.reduce((s, d) => s + d.safetyScore, 0) / Math.max(drivers.length, 1))}%`}
        />
      </section>
      <form className="mb-4 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search drivers..."
          className={`${fieldClass} min-w-64`}
        />
        <select name="status" defaultValue={status} className={fieldClass}>
          <option value="">All statuses</option>
          {["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className={buttonClass}>Filter</button>
      </form>
      <div className={`${cardClass} overflow-x-auto p-0`}>
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {[
                "Driver",
                "Licence",
                "Expires",
                "Safety",
                "Region",
                "Trips",
                "Compliance",
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
            {drivers.map((d) => {
              const compliance = driverCompliance(d);
              return (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-3">
                      <PersonAvatar name={d.name} />
                      <span>
                        <strong>{d.name}</strong>
                        <span className="block text-xs text-muted-foreground">
                          {d.employeeId}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {d.licenceNumber}
                    <span className="block text-xs text-muted-foreground">
                      {d.licenceCategory}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {d.licenceExpiry.toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-bold tabular-nums">
                    {d.safetyScore}
                  </td>
                  <td className="px-5 py-4">{d.region}</td>
                  <td className="px-5 py-4">
                    {d._count.trips}
                    {d.documents.map((document) => (
                      <span
                        key={document.id}
                        className="mt-1 flex gap-1 text-xs"
                      >
                        <a
                          className="text-primary"
                          href={`/files/${document.fileId}`}
                        >
                          {document.type}
                        </a>
                        {canManage && (
                          <form action={deleteDocument}>
                            <input
                              type="hidden"
                              name="entityType"
                              value="driver"
                            />
                            <input
                              type="hidden"
                              name="fileId"
                              value={document.fileId}
                            />
                            <button aria-label={`Delete ${document.type}`}>
                              ×
                            </button>
                          </form>
                        )}
                      </span>
                    ))}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge>{compliance}</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge>{d.status}</StatusBadge>
                  </td>
                  {canManage && (
                    <td className="px-5 py-4">
                      <details className="mb-2">
                        <summary className="cursor-pointer text-xs font-bold text-primary">
                          Document
                        </summary>
                        <form
                          action={uploadDocument}
                          className="mt-2 grid w-56 gap-2"
                        >
                          <input
                            type="hidden"
                            name="entityType"
                            value="driver"
                          />
                          <input type="hidden" name="entityId" value={d.id} />
                          <input
                            name="type"
                            required
                            placeholder="Driving licence"
                            className="rounded-full border px-3 py-1 text-xs"
                          />
                          <input
                            name="expiresAt"
                            type="date"
                            className="rounded-full border px-3 py-1 text-xs"
                          />
                          <input
                            name="file"
                            type="file"
                            accept="application/pdf,image/png,image/jpeg"
                            required
                            className="text-xs"
                          />
                          <button className="text-left text-xs font-bold text-primary">
                            Upload
                          </button>
                        </form>
                      </details>
                      <form action={setDriverStatus}>
                        <input type="hidden" name="id" value={d.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={
                            d.status === "SUSPENDED" ? "AVAILABLE" : "SUSPENDED"
                          }
                        />
                        <button className="text-xs font-bold text-primary">
                          {d.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
