import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/current-user";
import { PageHeader, cardClass, StatusBadge } from "@/components/operations";
import { VehicleAvatar } from "@/components/botanics";
import Link from "next/link";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("read:vehicles");
  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      documents: true,
      trips: { orderBy: { plannedStart: "desc" }, take: 10 },
      maintenanceLogs: { orderBy: { scheduledDate: "desc" }, take: 10 },
      fuelLogs: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!vehicle) return notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/vehicles" className="text-primary hover:underline text-sm font-bold">
          &larr; Back to Vehicles
        </Link>
      </div>
      <PageHeader
        eyebrow="Vehicle Details"
        title={vehicle.name}
        description={`Registration: ${vehicle.registrationNumber} • Type: ${vehicle.type}`}
        action={<StatusBadge>{vehicle.status}</StatusBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-primary">Overview</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Manufacturer:</strong> {vehicle.manufacturer}</div>
            <div><strong>Model:</strong> {vehicle.model}</div>
            <div><strong>Region:</strong> {vehicle.region}</div>
            <div><strong>Odometer:</strong> {vehicle.odometer} km</div>
            <div><strong>Capacity:</strong> {vehicle.maxLoadCapacity} kg</div>
            <div><strong>Acquisition Cost:</strong> ₹{vehicle.acquisitionCost}</div>
            <div><strong>Insurance Expiry:</strong> {vehicle.insuranceExpiry.toLocaleDateString("en-IN")}</div>
            <div><strong>Registration Expiry:</strong> {vehicle.registrationExpiry.toLocaleDateString("en-IN")}</div>
          </div>
        </section>

        <section className={`${cardClass} flex flex-col`}>
          <h2 className="mb-4 text-lg font-bold text-primary">Documents</h2>
          <div className="flex-1 overflow-hidden rounded-xl border bg-muted/30">
            {vehicle.documents.length > 0 ? (
              <iframe
                src={`/files/${vehicle.documents[0].fileId}`}
                className="w-full h-[500px] border-0 bg-white"
                title="Document Viewer"
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center text-sm text-muted-foreground">
                No documents uploaded.
              </div>
            )}
          </div>
          {vehicle.documents.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-auto">
              {vehicle.documents.map(d => (
                <a key={d.id} href={`/files/${d.fileId}`} target="_blank" className="text-xs text-primary hover:underline bg-muted px-2 py-1 rounded">
                  {d.type}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
