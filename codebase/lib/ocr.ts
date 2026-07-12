export function parseReceiptText(text: string) {
  const value = (patterns: RegExp[]) =>
    patterns.map((pattern) => text.match(pattern)?.[1]).find(Boolean) ?? "";
  const amount = value([
    /(?:total|amount)\s*[:₹rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i,
    /₹\s*([\d,]+(?:\.\d{1,2})?)/i,
  ]);
  const litres = value([/(?:litres?|ltr|qty)\s*[:=]*\s*([\d.]+)/i]);
  return {
    vendor:
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => /[a-z]{3}/i.test(line)) ?? "",
    receiptNumber: value([
      /(?:receipt|invoice|bill)\s*(?:no|#)?\s*[:#-]*\s*([A-Z0-9-]+)/i,
    ]),
    date: value([/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/]),
    amount: amount.replaceAll(",", ""),
    litres,
    rate: value([/(?:rate|price)\s*[:=₹rs.]*\s*([\d.]+)/i]),
    tax: value([/(?:tax|gst)\s*[:=₹rs.]*\s*([\d.]+)/i]),
    registrationNumber: value([
      /([A-Z]{2}[- ]?\d{1,2}[- ]?[A-Z]{1,2}[- ]?\d{4})/i,
    ]).toUpperCase(),
  };
}
