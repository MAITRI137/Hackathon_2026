import { describe, expect, it } from "vitest";
import { csvEscape, toCsv } from "@/lib/csv";

describe("csv export", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(csvEscape('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape("plain")).toBe("plain");
    expect(csvEscape(null)).toBe("");
  });

  it("serialises dates as ISO strings", () => {
    expect(csvEscape(new Date("2026-07-12T00:00:00Z"))).toBe("2026-07-12T00:00:00.000Z");
  });

  it("builds a BOM-prefixed CRLF document", () => {
    const csv = toCsv(["name", "note"], [["Van-05", "a,b"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("name,note\r\n");
    expect(csv).toContain('Van-05,"a,b"');
  });
});
