import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/current-user";
import { PageHeader, cardClass, StatusBadge } from "@/components/operations";
import Link from "next/link";

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("read:maintenance");
  const log = await db.maintenanceLog.findUnique({
    where: { id },
    include: {
      vehicle: true,
      invoiceFile: true,
    },
  });

  if (!log) return notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/maintenance" className="text-primary hover:underline text-sm font-bold">
          &larr; Back to Maintenance
        </Link>
      </div>
      <PageHeader
        eyebrow="Service Record"
        title={log.serviceType}
        description={`Vehicle: ${log.vehicle.name} • Priority: ${log.priority}`}
        action={<StatusBadge>{log.status}</StatusBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-primary">Overview</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2"><strong>Description:</strong> {log.description}</div>
            <div className="col-span-2"><strong>Notes:</strong> {log.notes || "-"}</div>
            <div><strong>Scheduled:</strong> {log.scheduledDate.toLocaleDateString("en-IN")}</div>
            <div><strong>Odometer:</strong> {log.odometer} km</div>
            <div><strong>Vendor:</strong> {log.vendor || "-"}</div>
            <div><strong>Technician:</strong> {log.technician || "-"}</div>
            <div><strong>Started:</strong> {log.startedDate?.toLocaleDateString("en-IN") || "-"}</div>
            <div><strong>Completed:</strong> {log.completedDate?.toLocaleDateString("en-IN") || "-"}</div>
            <div><strong>Estimated Cost:</strong> ₹{log.estimatedCost}</div>
            <div><strong>Actual Cost:</strong> {log.actualCost ? `₹${log.actualCost}` : "-"}</div>
          </div>
        </section>

        <section className={`${cardClass} flex flex-col`}>
          <h2 className="mb-4 text-lg font-bold text-primary">Invoice Document</h2>
          <div className="flex-1 overflow-hidden rounded-xl border bg-muted/30">
            {log.invoiceFileId ? (
              <iframe
                src={`/files/${log.invoiceFileId}`}
                className="w-full h-[500px] border-0 bg-white"
                title="Invoice Viewer"
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center text-sm text-muted-foreground">
                No invoice uploaded.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
