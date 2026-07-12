import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { cardClass, PageHeader, StatusBadge } from "@/components/operations";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  await requirePermission("read:settings");
  const [roles, users, audit] = await Promise.all([
    db.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({ include: { role: true }, orderBy: { name: "asc" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Governance"
        title="Settings & RBAC"
        description="Demo identities, permission scopes and an immutable operational activity trail."
      />
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold">Demo users</h2>
          <ul className="mt-4 divide-y">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <strong>{user.name}</strong>
                  <span className="block text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <StatusBadge>{user.role.name}</StatusBadge>
              </li>
            ))}
          </ul>
        </section>
        <section className={`${cardClass} overflow-x-auto`}>
          <h2 className="text-xl font-semibold">Role permission matrix</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <article key={role.id} className="rounded-2xl bg-muted p-4">
                <div className="flex justify-between">
                  <strong>{role.name}</strong>
                  <span className="text-xs text-muted-foreground">
                    {role._count.users} user(s)
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {role.permissions
                    .map(
                      (x) => `${x.permission.action}:${x.permission.subject}`
                    )
                    .join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className={`${cardClass} overflow-x-auto p-0 xl:col-span-2`}>
          <div className="p-5">
            <h2 className="text-xl font-semibold">Audit log</h2>
            <p className="text-sm text-muted-foreground">
              Authentication, entity changes, workflow transitions and exports.
            </p>
          </div>
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-y bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {["Time", "Action", "Entity", "Entity ID", "Details"].map(
                  (h) => (
                    <th key={h} className="px-5 py-3">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {audit.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="px-5 py-3 text-xs">
                    {log.createdAt.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3 font-bold">{log.action}</td>
                  <td className="px-5 py-3">{log.entityType}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {log.entityId || "—"}
                  </td>
                  <td className="px-5 py-3 text-xs">{log.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
