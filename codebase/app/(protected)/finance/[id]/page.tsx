import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/current-user";
import { PageHeader, cardClass, StatusBadge } from "@/components/operations";
import Link from "next/link";

export default async function FinanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("read:finance");
  const expense = await db.expense.findUnique({
    where: { id },
    include: {
      vehicle: true,
      trip: true,
      receiptFile: true,
    },
  });

  if (!expense) return notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/finance" className="text-primary hover:underline text-sm font-bold">
          &larr; Back to Finance
        </Link>
      </div>
      <PageHeader
        eyebrow="Expense Record"
        title={expense.category}
        description={`Amount: ₹${expense.amount} • Date: ${expense.date.toLocaleDateString("en-IN")}`}
        action={<StatusBadge>{expense.status}</StatusBadge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-primary">Overview</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2"><strong>Description:</strong> {expense.description}</div>
            <div><strong>Vehicle:</strong> {expense.vehicle?.name || "General"}</div>
            <div><strong>Trip:</strong> {expense.trip ? `Trip ${expense.trip.tripNumber}` : "-"}</div>
            <div><strong>Submitted By:</strong> {expense.submittedById || "-"}</div>
            <div><strong>Approved By:</strong> {expense.approvedById || "-"}</div>
            <div><strong>Approved At:</strong> {expense.approvedAt?.toLocaleDateString("en-IN") || "-"}</div>
            <div className="col-span-2">
              <strong>Raw OCR Text:</strong>
              <pre className="mt-2 text-xs bg-muted p-2 rounded max-h-32 overflow-auto">
                {expense.rawOcrText || "No OCR text extracted"}
              </pre>
            </div>
          </div>
        </section>

        <section className={`${cardClass} flex flex-col`}>
          <h2 className="mb-4 text-lg font-bold text-primary">Receipt Document</h2>
          <div className="flex-1 overflow-hidden rounded-xl border bg-muted/30">
            {expense.receiptFileId ? (
              <iframe
                src={`/files/${expense.receiptFileId}`}
                className="w-full h-[500px] border-0 bg-white"
                title="Receipt Viewer"
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center text-sm text-muted-foreground">
                No receipt uploaded.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
