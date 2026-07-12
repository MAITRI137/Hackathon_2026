"use client";
import Form from "next/form";

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
  const [preview, setPreview] = useState("");

  async function extract(file?: File) {
    if (!file) {
      setPreview("");
      return;
    }
    setBusy(true);
    setRaw("");
    
    let imageForOcr: File | string = file;
    let previewDataUrl = "";

    if (file.type === "application/pdf") {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      
      if (context) {
        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        previewDataUrl = canvas.toDataURL("image/png");
        imageForOcr = previewDataUrl;
      }
    } else {
      previewDataUrl = URL.createObjectURL(file);
    }
    
    setPreview(previewDataUrl);

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      logger: (m) =>
        m.status === "recognizing text" &&
        setProgress(Math.round((m.progress || 0) * 100)),
    });
    const result = await worker.recognize(imageForOcr);
    await worker.terminate();
    setRaw(result.data.text);
    setParsed(parseReceiptText(result.data.text));
    setBusy(false);
  }

  return (
    <Form action={submitExpense} className="grid gap-3 sm:grid-cols-2">
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

      {preview && (
        <div className="sm:col-span-2 flex justify-center bg-muted/30 p-2 rounded-2xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Receipt preview" className="max-h-64 object-contain rounded-xl" />
        </div>
      )}

      {busy && (
        <div className="rounded-full bg-muted sm:col-span-2">
          <div
            className="h-2 rounded-full bg-primary transition-all"
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
    </Form>
  );
}
