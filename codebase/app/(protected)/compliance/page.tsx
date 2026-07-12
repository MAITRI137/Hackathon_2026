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
  resolveAlert,
  runComplianceScan,
  sendComplianceReminders,
} from "../actions";

export const dynamic = "force-dynamic";
export default async function CompliancePage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    severity?: string;
    status?: string;
    message?: string;
  }>;
}) {
  const user = await requirePermission("read:compliance");
  const canManage = hasPermission(user, "manage:compliance");
  const params = await searchParams;
  const [alerts, outbox, audit] = await Promise.all([
    db.complianceAlert.findMany({
      where: {
        ...(params?.severity && { severity: params.severity }),
        ...(params?.status && { status: params.status }),
        ...(params?.q && { message: { contains: params.q } }),
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.emailOutbox.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.auditLog.findMany({
      where: {
        OR: [
          { entityType: "ComplianceAlert" },
          { action: "COMPLIANCE_SCAN" },
          { action: "SEND_REMINDERS" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Risk and readiness"
        title="Compliance Centre"
        description="Detect expiring documents, safety exceptions, overdue maintenance and loss-making work before dispatch."
        action={
          canManage && (
            <div className="flex flex-wrap gap-2">
              <form action={runComplianceScan}>
                <button className={buttonClass}>
                  Generate compliance scan
                </button>
              </form>
              <form action={sendComplianceReminders}>
                <button className="min-h-11 rounded-full border bg-card px-4 text-sm font-bold text-primary">
                  Send reminders
                </button>
              </form>
            </div>
          )
        }
      />
      {params?.message && (
        <p className="mb-4 rounded-2xl bg-primary/10 p-3 text-sm text-primary">
          {params.message}
        </p>
      )}
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open alerts"
          value={alerts.filter((a) => a.status === "OPEN").length}
        />
        <StatCard
          label="Critical"
          value={
            alerts.filter(
              (a) => a.status === "OPEN" && a.severity === "CRITICAL"
            ).length
          }
        />
        <StatCard
          label="Warnings"
          value={
            alerts.filter(
              (a) => a.status === "OPEN" && a.severity === "WARNING"
            ).length
          }
        />
        <StatCard
          label="Resolved"
          value={alerts.filter((a) => a.status === "RESOLVED").length}
        />
      </section>
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params?.q}
          placeholder="Search alerts..."
          className={`${fieldClass} min-w-64`}
        />
        <select
          name="severity"
          defaultValue={params?.severity || ""}
          className={fieldClass}
        >
          <option value="">All severities</option>
          {["INFO", "WARNING", "CRITICAL"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params?.status || ""}
          className={fieldClass}
        >
          <option value="">All statuses</option>
          {["OPEN", "RESOLVED"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className={buttonClass}>Filter</button>
      </form>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <section className={`${cardClass} overflow-x-auto p-0`}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {[
                  "Issue",
                  "Entity",
                  "Severity",
                  "Due / expiry",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h} className="px-5 py-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-5 py-4">{a.message}</td>
                  <td className="px-5 py-4">{a.entityType}</td>
                  <td className="px-5 py-4">
                    <StatusBadge>{a.severity}</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    {a.dueDate?.toLocaleDateString("en-IN") || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge>{a.status}</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    {canManage && a.status === "OPEN" && (
                      <form action={resolveAlert}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-xs font-bold text-primary">
                          Resolve
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <aside className="grid gap-5">
          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Email outbox</h2>
            <ul className="mt-3 divide-y">
              {outbox.map((email) => (
                <li key={email.id} className="py-3 text-xs">
                  <div className="flex justify-between">
                    <strong>{email.recipient}</strong>
                    <StatusBadge>{email.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{email.subject}</p>
                  {email.failureMessage && (
                    <p className="mt-1 text-red-700">
                      Saved to outbox: {email.failureMessage}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section className={cardClass}>
            <h2 className="text-xl font-semibold">Audit timeline</h2>
            <ol className="mt-3 border-l pl-4">
              {audit.map((log) => (
                <li
                  key={log.id}
                  className="relative mb-4 text-xs before:absolute before:-left-[21px] before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-primary"
                >
                  <strong>{log.action.replaceAll("_", " ")}</strong>
                  <p className="text-muted-foreground">
                    {log.details || log.entityType}
                  </p>
                  <time className="text-muted-foreground">
                    {log.createdAt.toLocaleString("en-IN")}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
