export function csvEscape(value: unknown): string {
  const text =
    value == null
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** UTF-8 CSV with BOM so spreadsheets read ₹ and accents correctly. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(","));
  return "﻿" + lines.join("\r\n");
}
