import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/current-user";
import { PageHeader, cardClass, StatusBadge } from "@/components/operations";
import Link from "next/link";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("read:vehicles"); // Trips fall under vehicles usually
  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      events: { orderBy: { createdAt: "desc" } },
      fuelLogs: { include: { receiptFile: true } },
      expenses: { include: { receiptFile: true } },
    },
  });

  if (!trip) return notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/trips" className="text-primary hover:underline text-sm font-bold">
          &larr; Back to Trips
        </Link>
      </div>
      <PageHeader
        eyebrow={`Trip ${trip.tripNumber}`}
        title={`${trip.source} to ${trip.destination}`}
        description={`Vehicle: ${trip.vehicle?.name || "Unassigned"} • Driver: ${trip.driver?.name || "Unassigned"}`}
        action={<StatusBadge>{trip.status}</StatusBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-primary">Overview</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Planned Start:</strong> {trip.plannedStart.toLocaleString("en-IN")}</div>
            <div><strong>Planned End:</strong> {trip.plannedCompletion.toLocaleString("en-IN")}</div>
            <div><strong>Actual Start:</strong> {trip.actualStart?.toLocaleString("en-IN") || "-"}</div>
            <div><strong>Actual End:</strong> {trip.actualCompletion?.toLocaleString("en-IN") || "-"}</div>
            <div><strong>Cargo:</strong> {trip.cargoDescription} ({trip.cargoWeight} kg)</div>
            <div><strong>Distance:</strong> {trip.plannedDistance} km</div>
            <div><strong>Expected Revenue:</strong> ₹{trip.expectedRevenue}</div>
            <div><strong>Estimated Margin:</strong> ₹{trip.estimatedMargin}</div>
          </div>
        </section>

        <section className={`${cardClass} flex flex-col`}>
          <h2 className="mb-4 text-lg font-bold text-primary">Receipts & Documents</h2>
          <div className="flex-1 overflow-hidden rounded-xl border bg-muted/30 p-4">
            <h3 className="font-bold mb-2">Fuel Logs</h3>
            {trip.fuelLogs.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {trip.fuelLogs.map(f => (
                  <li key={f.id} className="text-sm">
                    {f.date.toLocaleDateString("en-IN")}: ₹{f.cost} ({f.litres}L)
                    {f.receiptFileId && (
                      <a href={`/files/${f.receiptFileId}`} target="_blank" className="ml-2 text-xs text-primary hover:underline">
                        View Receipt
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground mb-4">No fuel logs.</p>}

            <h3 className="font-bold mb-2">Expenses</h3>
            {trip.expenses.length > 0 ? (
              <ul className="space-y-2">
                {trip.expenses.map(e => (
                  <li key={e.id} className="text-sm">
                    {e.category}: ₹{e.amount}
                    {e.receiptFileId && (
                      <a href={`/files/${e.receiptFileId}`} target="_blank" className="ml-2 text-xs text-primary hover:underline">
                        View Receipt
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No expenses.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
