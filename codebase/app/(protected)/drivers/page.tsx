import { requirePermission } from "@/lib/auth/current-user";

export default async function DriversPage() {
  await requirePermission("read:drivers");
  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">Drivers</h1>
      <div className="p-6 bg-card rounded-lg shadow-sm border border-border">
        <p className="text-muted-foreground">Drivers module content goes here.</p>
      </div>
    </div>
  );
}
