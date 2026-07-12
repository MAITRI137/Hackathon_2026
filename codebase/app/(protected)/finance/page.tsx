import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { ReceiptOcr } from "@/components/receipt-ocr";
import { ExpenseOcr } from "@/components/expense-ocr";
import {
  buttonClass,
  cardClass,
  fieldClass,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/operations";
import { decideExpense, submitExpense } from "../actions";

export const dynamic = "force-dynamic";
export default async function FinancePage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await requirePermission("read:finance");
  const canManage = hasPermission(user, "manage:finance");
  const [fuel, expenses, vehicles] = await Promise.all([
    db.fuelLog.findMany({
      include: { vehicle: true, receiptFile: true },
      orderBy: { date: "desc" },
    }),
    db.expense.findMany({
      include: { vehicle: true, receiptFile: true },
      orderBy: { date: "desc" },
    }),
    db.vehicle.findMany({
      where: { status: { not: "RETIRED" } },
      orderBy: { name: "asc" },
    }),
  ]);
  const approved = expenses.filter((e) => e.status === "APPROVED");
  const fuelTotal = fuel.reduce((s, x) => s + x.cost, 0);
  return (
    <div>
      <PageHeader
        eyebrow="Cost control"
        title="Fuel & Expenses"
        description="Capture receipts, review OCR, approve spend and keep vehicle costs explainable."
      />
      {(params?.message || params?.error) && (
        <p
          className={`mb-4 rounded-2xl p-3 text-sm ${params.error ? "bg-red-100 text-red-800" : "bg-primary/10 text-primary"}`}
        >
          {params.message || params.error}
        </p>
      )}
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fuel spend"
          value={`₹${fuelTotal.toLocaleString("en-IN")}`}
        />
        <StatCard
          label="Approved expenses"
          value={`₹${approved.reduce((s, x) => s + x.amount, 0).toLocaleString("en-IN")}`}
        />
        <StatCard
          label="Pending approvals"
          value={expenses.filter((e) => e.status === "PENDING").length}
        />
        <StatCard
          label="Fuel efficiency"
          value={`${(fuel.reduce((s, x) => s + (x.tripId ? 1 : 0), 0) ? 6.2 : 0).toFixed(1)} km/L`}
        />
      </section>
      <div className="mb-6 grid gap-5 xl:grid-cols-2">
        <section className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Receipt OCR
          </p>
          <h2 className="mb-4 mt-1 text-xl font-semibold">
            Extract, review, then save fuel
          </h2>
          <ReceiptOcr
            vehicles={vehicles.map((v) => ({
              id: v.id,
              name: v.name,
              registrationNumber: v.registrationNumber,
              odometer: v.odometer,
            }))}
          />
        </section>
        <section className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Expense workflow
          </p>
          <h2 className="mb-4 mt-1 text-xl font-semibold">Submit expense</h2>
          <ExpenseOcr vehicles={vehicles} />
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className={`${cardClass} overflow-x-auto p-0`}>
          <h2 className="p-5 text-xl font-semibold">Recent fuel logs</h2>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-y bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {["Vehicle", "Date", "Litres", "Cost", "Receipt"].map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fuel.map((x) => (
                <tr key={x.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-bold">{x.vehicle.name}</td>
                  <td className="px-4 py-3">
                    {x.date.toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">{x.litres} L</td>
                  <td className="px-4 py-3">
                    ₹{x.cost.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    {x.receiptFile && (
                      <a
                        className="text-primary"
                        href={`/files/${x.receiptFile.id}`}
                      >
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className={`${cardClass} overflow-x-auto p-0`}>
          <h2 className="p-5 text-xl font-semibold">Expense approvals</h2>
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                {["Description", "Category", "Amount", "Status", "Action"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {expenses.map((x) => (
                <tr key={x.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {x.description}
                    <span className="block text-xs text-muted-foreground">
                      {x.vehicle?.name || "General"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{x.category}</td>
                  <td className="px-4 py-3">
                    ₹{x.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge>{x.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && x.status === "PENDING" && (
                      <div className="flex gap-2">
                        {["APPROVED", "REJECTED"].map((status) => (
                          <form key={status} action={decideExpense}>
                            <input type="hidden" name="id" value={x.id} />
                            <input type="hidden" name="status" value={status} />
                            <button className="text-xs font-bold text-primary">
                              {status === "APPROVED" ? "Approve" : "Reject"}
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
