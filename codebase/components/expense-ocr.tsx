"use client";

import { useState } from "react";
import { parseReceiptText } from "@/lib/ocr";
import { submitExpense } from "@/app/(protected)/actions";
import { buttonClass, fieldClass } from "@/components/operations";

export function ExpenseOcr({
  vehicles,
}: {
  vehicles: { id: string; name: string }[];
}) {
  const [progress, setProgress] = useState(0);
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ReturnType<
    typeof parseReceiptText
  > | null>(null);
  const [busy, setBusy] = useState(false);

  async function extract(file?: File) {
    if (!file) return;
    setBusy(true);
    setRaw("");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", undefined, {
      logger: (m) =>
        m.status === "recognizing text" &&
        setProgress(Math.round((m.progress || 0) * 100)),
    });
    const result = await worker.recognize(file);
    await worker.terminate();
    setRaw(result.data.text);
    setParsed(parseReceiptText(result.data.text));
    setBusy(false);
  }

  return (
    <form action={submitExpense} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-xs font-bold sm:col-span-2">
        Receipt image (Auto-fills amount & date)
        <input
          name="receipt"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          className={fieldClass}
          onChange={(e) => extract(e.target.files?.[0])}
        />
      </label>

      {busy && (
        <div className="rounded-full bg-muted sm:col-span-2">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {raw && (
        <details className="rounded-2xl bg-muted p-3 sm:col-span-2">
          <summary className="cursor-pointer text-sm font-bold">
            Review OCR text
          </summary>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs">
            {raw}
          </pre>
        </details>
      )}

      <input type="hidden" name="rawOcrText" value={raw} />

      <label className="grid gap-1 text-xs font-bold">
        Vehicle
        <select name="vehicleId" className={fieldClass}>
          <option value="">General</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-bold">
        Category
        <select name="category" className={fieldClass}>
          {[
            "Fuel",
            "Toll",
            "Parking",
            "Repair",
            "Maintenance",
            "Fine",
            "Loading/Unloading",
            "Driver Allowance",
            "Miscellaneous",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-bold">
        Amount
        <input
          key={`amount-${parsed?.amount}`}
          name="amount"
          type="number"
          step=".01"
          defaultValue={parsed?.amount}
          required
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1 text-xs font-bold">
        Date
        <input
          key={`date-${parsed?.date}`}
          name="date"
          type="date"
          defaultValue={(() => {
            if (parsed?.date) {
              const match = parsed.date.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
              if (match) {
                const [, d, m, y] = match;
                return `${y.length === 2 ? "20" + y : y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
              }
            }
            return new Date().toISOString().slice(0, 10);
          })()}
          required
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1 text-xs font-bold sm:col-span-2">
        Description
        <input
          key={`desc-${parsed?.vendor}`}
          name="description"
          defaultValue={parsed?.vendor ? `Expense at ${parsed.vendor}` : ""}
          required
          className={fieldClass}
        />
      </label>

      <button disabled={busy} className={`${buttonClass} sm:col-span-2`}>
        Submit for approval
      </button>
    </form>
  );
}
