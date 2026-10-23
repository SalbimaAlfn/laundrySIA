/**
 * Invoice numbers are `INV-YYYYMMDD-NNN`, where NNN is the sequence for that
 * business day. The sequence is taken from the invoice_counters row.
 */
export function formatInvoiceNo(businessDay: string, sequence: number): string {
  const compactDay = businessDay.replaceAll("-", "");
  return `INV-${compactDay}-${String(sequence).padStart(3, "0")}`;
}

export function nextInvoiceNo(businessDay: string, lastSequence: number): string {
  return formatInvoiceNo(businessDay, lastSequence + 1);
}
