import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/current-user";
import { PageHeader, cardClass, StatusBadge } from "@/components/operations";
import Link from "next/link";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("read:drivers");
  const driver = await db.driver.findUnique({
    where: { id },
    include: {
      documents: true,
      trips: { orderBy: { plannedStart: "desc" }, take: 10 },
    },
  });

  if (!driver) return notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/drivers" className="text-primary hover:underline text-sm font-bold">
          &larr; Back to Drivers
        </Link>
      </div>
      <PageHeader
        eyebrow="Driver Details"
        title={driver.name}
        description={`Employee ID: ${driver.employeeId} • Region: ${driver.region}`}
        action={<StatusBadge>{driver.status}</StatusBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-primary">Overview</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Licence Number:</strong> {driver.licenceNumber}</div>
            <div><strong>Licence Category:</strong> {driver.licenceCategory}</div>
            <div><strong>Licence Expiry:</strong> {driver.licenceExpiry.toLocaleDateString("en-IN")}</div>
            <div><strong>Contact Number:</strong> {driver.contactNumber}</div>
            <div><strong>Emergency Contact:</strong> {driver.emergencyContact}</div>
            <div><strong>Safety Score:</strong> {driver.safetyScore}/100</div>
            <div><strong>Date Joined:</strong> {driver.dateJoined.toLocaleDateString("en-IN")}</div>
          </div>
        </section>

        <section className={`${cardClass} flex flex-col`}>
          <h2 className="mb-4 text-lg font-bold text-primary">Documents</h2>
          <div className="flex-1 overflow-hidden rounded-xl border bg-muted/30">
            {driver.documents.length > 0 ? (
              <iframe
                src={`/files/${driver.documents[0].fileId}`}
                className="w-full h-[500px] border-0 bg-white"
                title="Document Viewer"
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center text-sm text-muted-foreground">
                No documents uploaded.
              </div>
            )}
          </div>
          {driver.documents.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-auto">
              {driver.documents.map(d => (
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
