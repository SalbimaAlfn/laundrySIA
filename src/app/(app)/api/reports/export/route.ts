import { NextRequest } from "next/server";
import { businessDate } from "@/lib/dates";
import { requireRole } from "@/server/auth";
import { ledger } from "@/server/accounting/queries";
import {
  balanceSheet,
  cashFlow,
  incomeStatement,
  salesReport,
  trialBalanceReport,
} from "@/server/reports/queries";

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: Array<Array<string | number>>): string {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}

export async function GET(request: NextRequest) {
  await requireRole("MANAGER");
  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "income-statement";
  const today = businessDate();
  const from = params.get("from") ?? `${today.slice(0, 8)}01`;
  const to = params.get("to") ?? today;
  const asOf = params.get("asOf") ?? today;
  const account = params.get("account") ?? "1-100";

  let rows: Array<Array<string | number>>;
  if (type === "cash-flow") {
    const data = await cashFlow(from, to);
    rows = [
      ["Opening cash", data.opening],
      ["Cash in", data.cashIn],
      ["Cash out", data.cashOut],
      ["Net", data.net],
      ["Closing cash", data.closing],
    ];
  } else if (type === "balance-sheet") {
    const data = await balanceSheet(asOf);
    rows = [
      ["Code", "Account", "Balance"],
      ...data.assets.map((row) => [row.code, row.name, row.balance]),
      ["Total assets", data.totalAssets],
      ["Equity", data.equity],
      ["Balanced", data.balanced ? "Yes" : "No"],
    ];
  } else if (type === "sales") {
    const data = await salesReport(from, to);
    rows = [
      ["Service", "Quantity", "Revenue"],
      ...data.byService.map((row) => [row.serviceName, row.quantity / 100, row.revenue]),
    ];
  } else if (type === "ledger") {
    const data = await ledger(account, from, to);
    let running = 0;
    rows = [
      ["Date", "Description", "Debit", "Credit", "Balance"],
      ...data.map((row) => {
        running += row.debit - row.credit;
        return [new Date(row.date).toISOString().slice(0, 10), row.description, row.debit, row.credit, running];
      }),
    ];
  } else if (type === "trial-balance") {
    const data = await trialBalanceReport(asOf);
    rows = [
      ["Code", "Account", "Debit", "Credit"],
      ...data.rows.map((row) => [row.code, row.name, row.debit, row.credit]),
      ["Total", "", data.totalDebit, data.totalCredit],
    ];
  } else {
    const data = await incomeStatement(from, to);
    rows = [
      ["Account", "Amount"],
      ...data.revenueRows.map((row) => [row.name, row.balance]),
      ["Total revenue", data.revenue],
      ...data.expenseRows.map((row) => [row.name, row.balance]),
      ["Total expenses", data.expenses],
      ["Profit", data.profit],
    ];
  }

  return new Response(`\uFEFF${csv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}.csv"`,
    },
  });
}
