import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/reports/print-button";
import { addBusinessDays, businessDate, formatDate } from "@/lib/dates";
import { getDictionary } from "@/lib/i18n";
import { formatRupiah } from "@/lib/money";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { ledger } from "@/server/accounting/queries";
import {
  balanceSheet,
  cashFlow,
  incomeStatement,
  salesReport,
  trialBalanceReport,
} from "@/server/reports/queries";
import styles from "@/components/reports/reports.module.css";

const reportTypes = [
  "income-statement",
  "cash-flow",
  "balance-sheet",
  "sales",
  "ledger",
  "trial-balance",
] as const;

type ReportType = (typeof reportTypes)[number];

type ReportPageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ from?: string; to?: string; asOf?: string; account?: string }>;
};

function isReportType(value: string): value is ReportType {
  return (reportTypes as readonly string[]).includes(value);
}

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  await requireRole("MANAGER");
  const [{ type }, query] = await Promise.all([params, searchParams]);
  if (!isReportType(type)) notFound();

  const t = getDictionary();
  const today = businessDate();
  const from = query.from ?? `${today.slice(0, 8)}01`;
  const to = query.to ?? today;
  const asOf = query.asOf ?? today;
  const accountCode = query.account ?? "1-100";
  const accounts = type === "ledger"
    ? await db.account.findMany({ orderBy: { code: "asc" }, select: { code: true, name: true } })
    : [];
  const activeAccount = accounts.find((account) => account.code === accountCode) ?? accounts[0];
  const weekStart = addBusinessDays(
    today,
    -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7),
  );
  const accountParam = activeAccount ? `&account=${activeAccount.code}` : "";

  const titles: Record<ReportType, string> = {
    "income-statement": t.reports.incomeStatement,
    "cash-flow": t.reports.cashFlow,
    "balance-sheet": t.reports.balanceSheet,
    sales: t.reports.sales,
    ledger: t.reports.ledger,
    "trial-balance": t.reports.trialBalance,
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{titles[type]}</h1>
          <p className={styles.lead}>{t.reports.period}</p>
        </div>
        <div className={styles.actions}>
          <PrintButton label={t.reports.print} />
          <a
            className={styles.link}
            href={`/api/reports/export?type=${type}&from=${from}&to=${to}&asOf=${asOf}&account=${activeAccount?.code ?? accountCode}`}
            style={{ padding: "var(--s-2) var(--s-4)" }}
          >
            {t.reports.export}
          </a>
        </div>
      </header>

      <form className={styles.filters} method="get">
        {type !== "balance-sheet" && type !== "trial-balance" ? (
          <div className={styles.presets}>
            <Link href={`/reports/${type}?from=${today}&to=${today}${accountParam}`}>
              {t.reports.today}
            </Link>
            <Link href={`/reports/${type}?from=${weekStart}&to=${today}${accountParam}`}>
              {t.reports.thisWeek}
            </Link>
            <Link href={`/reports/${type}?from=${today.slice(0, 8)}01&to=${today}${accountParam}`}>
              {t.reports.thisMonth}
            </Link>
            <span>{t.reports.custom}</span>
          </div>
        ) : null}
        {type === "balance-sheet" || type === "trial-balance" ? (
          <label>
            {t.reports.asOf}
            <input type="date" name="asOf" defaultValue={asOf} />
          </label>
        ) : (
          <>
            <label>
              {t.reports.from}
              <input type="date" name="from" defaultValue={from} />
            </label>
            <label>
              {t.reports.to}
              <input type="date" name="to" defaultValue={to} />
            </label>
          </>
        )}
        {type === "ledger" ? (
          <label>
            {t.reports.account}
            <select name="account" defaultValue={activeAccount?.code ?? accountCode}>
              {accounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="submit" style={{ minHeight: "var(--field-h)", padding: "0 var(--s-4)" }}>
          {t.reports.apply}
        </button>
      </form>

      {type === "income-statement" ? <IncomeStatementView from={from} to={to} /> : null}
      {type === "cash-flow" ? <CashFlowView from={from} to={to} /> : null}
      {type === "balance-sheet" ? <BalanceSheetView asOf={asOf} /> : null}
      {type === "sales" ? <SalesView from={from} to={to} /> : null}
      {type === "ledger" && activeAccount ? (
        <LedgerView from={from} to={to} code={activeAccount.code} name={activeAccount.name} />
      ) : null}
      {type === "trial-balance" ? <TrialBalanceView asOf={asOf} /> : null}
    </section>
  );
}

async function IncomeStatementView({ from, to }: { from: string; to: string }) {
  const t = getDictionary();
  const data = await incomeStatement(from, to);
  return (
    <>
      <p className={styles.summary}>
        {t.reports.summaryIncome} {formatRupiah(data.profit)}.
      </p>
      <div className={styles.cards}>
        <div className={styles.card}><span>{t.reports.revenue}</span><strong>{formatRupiah(data.revenue)}</strong></div>
        <div className={styles.card}><span>{t.reports.expenses}</span><strong>{formatRupiah(data.expenses)}</strong></div>
        <div className={styles.card}><span>{t.reports.profit}</span><strong>{formatRupiah(data.profit)}</strong></div>
      </div>
      <AccountTable title={t.reports.revenue} rows={data.revenueRows} total={data.revenue} />
      <AccountTable title={t.reports.expenses} rows={data.expenseRows} total={data.expenses} />
    </>
  );
}

async function CashFlowView({ from, to }: { from: string; to: string }) {
  const t = getDictionary();
  const data = await cashFlow(from, to);
  return (
    <>
      <p className={styles.summary}>
        {t.reports.summaryCash} {formatRupiah(data.closing)}.
      </p>
      <div className={styles.cards}>
        <div className={styles.card}><span>{t.reports.openingCash}</span><strong>{formatRupiah(data.opening)}</strong></div>
        <div className={styles.card}><span>{t.reports.cashIn}</span><strong>{formatRupiah(data.cashIn)}</strong></div>
        <div className={styles.card}><span>{t.reports.cashOut}</span><strong>{formatRupiah(data.cashOut)}</strong></div>
        <div className={styles.card}><span>{t.reports.netCash}</span><strong>{formatRupiah(data.net)}</strong></div>
        <div className={styles.card}><span>{t.reports.closingCash}</span><strong>{formatRupiah(data.closing)}</strong></div>
      </div>
      <div className={styles.section}>
        <h2>{t.reports.cashIn}</h2>
        <table className={styles.table}>
          <thead><tr><th>{t.reports.accountName}</th><th className={styles.right}>{t.reports.total}</th></tr></thead>
          <tbody>
            {data.groups.map((group) => (
              <tr key={group.label}>
                <td>{group.label === "Order payments" ? t.reports.orderPayments : t.reports.other}</td>
                <td className={styles.right}>{formatRupiah(group.amount)}</td>
              </tr>
            ))}
            <tr className={styles.totalRow}><td>{t.reports.total}</td><td className={styles.right}>{formatRupiah(data.cashIn)}</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

async function BalanceSheetView({ asOf }: { asOf: string }) {
  const t = getDictionary();
  const data = await balanceSheet(asOf);
  return (
    <>
      <p className={styles.summary}>
        {t.reports.summaryBalance} {formatRupiah(data.totalAssets)} / {formatRupiah(data.equity)}.
      </p>
      <AccountTable title={t.reports.assets} rows={data.assets} total={data.totalAssets} />
      <div className={styles.cards}>
        <div className={styles.card}><span>{t.reports.equity} ({t.reports.profit})</span><strong>{formatRupiah(data.profit)}</strong></div>
        <div className={styles.card}><span>{t.reports.equity}</span><strong>{formatRupiah(data.equity)}</strong></div>
      </div>
      <p className={`${styles.check} ${data.balanced ? styles.ok : styles.bad}`}>
        {data.balanced ? t.reports.balanced : t.reports.notBalanced} {formatRupiah(data.totalAssets)} / {formatRupiah(data.equity)}
      </p>
    </>
  );
}

async function SalesView({ from, to }: { from: string; to: string }) {
  const t = getDictionary();
  const data = await salesReport(from, to);
  return (
    <>
      <p className={styles.summary}>
        {t.reports.summarySales} {formatRupiah(data.totalRevenue)}.
      </p>
      <div className={styles.section}>
        <h2>{t.reports.service}</h2>
        {data.byService.length === 0 ? <p>{t.reports.noData}</p> : (
          <table className={styles.table}>
            <thead><tr><th>{t.reports.service}</th><th className={styles.right}>{t.reports.quantity}</th><th className={styles.right}>{t.reports.revenue}</th></tr></thead>
            <tbody>
              {data.byService.map((row) => (
                <tr key={`${row.serviceName}-${row.unit}`}>
                  <td>{row.serviceName}</td>
                  <td className={styles.right}>{(row.quantity / 100).toFixed(2)}</td>
                  <td className={styles.right}>{formatRupiah(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className={styles.section}>
        <h2>{t.reports.day}</h2>
        {data.byDay.length === 0 ? <p>{t.reports.noData}</p> : (
          <table className={styles.table}>
            <thead><tr><th>{t.reports.day}</th><th className={styles.right}>{t.reports.orders}</th><th className={styles.right}>{t.reports.revenue}</th></tr></thead>
            <tbody>
              {data.byDay.map((row) => (
                <tr key={row.day}>
                  <td>{formatDate(row.day)}</td>
                  <td className={styles.right}>{row.orders}</td>
                  <td className={styles.right}>{formatRupiah(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

async function LedgerView({ from, to, code, name }: { from: string; to: string; code: string; name: string }) {
  const t = getDictionary();
  const rows = await ledger(code, from, to);
  const lines = rows.map((row, index) => ({
    ...row,
    running: rows
      .slice(0, index + 1)
      .reduce((total, item) => total + item.debit - item.credit, 0),
  }));
  return (
    <>
      <p className={styles.summary}>{t.reports.summaryLedger}: {code} — {name}.</p>
      <div className={styles.section}>
        <h2>{t.reports.ledger}</h2>
        {rows.length === 0 ? <p>{t.reports.noData}</p> : (
          <table className={styles.table}>
            <thead><tr><th>{t.reports.date}</th><th>{t.reports.accountName}</th><th className={styles.right}>{t.reports.debit}</th><th className={styles.right}>{t.reports.credit}</th><th className={styles.right}>{t.reports.balance}</th></tr></thead>
            <tbody>
              {lines.map((row) => (
                <tr key={`${row.entryId}-${row.debit}-${row.credit}`}>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.description}</td>
                  <td className={styles.right}>{formatRupiah(row.debit)}</td>
                  <td className={styles.right}>{formatRupiah(row.credit)}</td>
                  <td className={styles.right}>{formatRupiah(row.running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

async function TrialBalanceView({ asOf }: { asOf: string }) {
  const t = getDictionary();
  const data = await trialBalanceReport(asOf);
  return (
    <>
      <p className={styles.summary}>{t.reports.summaryTrial}</p>
      <div className={styles.section}>
        <table className={styles.table}>
          <thead><tr><th>{t.reports.code}</th><th>{t.reports.accountName}</th><th className={styles.right}>{t.reports.debit}</th><th className={styles.right}>{t.reports.credit}</th></tr></thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.code}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td className={styles.right}>{formatRupiah(row.debit)}</td>
                <td className={styles.right}>{formatRupiah(row.credit)}</td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td colSpan={2}>{t.reports.total}</td>
              <td className={styles.right}>{formatRupiah(data.totalDebit)}</td>
              <td className={styles.right}>{formatRupiah(data.totalCredit)}</td>
            </tr>
          </tbody>
        </table>
        <p className={`${styles.check} ${data.balanced ? styles.ok : styles.bad}`}>
          {data.balanced ? t.reports.balanced : t.reports.notBalanced}
        </p>
      </div>
    </>
  );
}

function AccountTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: Array<{ code: string; name: string; balance: number }>;
  total: number;
}) {
  const t = getDictionary();
  return (
    <div className={styles.section}>
      <h2>{title}</h2>
      {rows.length === 0 ? <p>{t.reports.noData}</p> : (
        <table className={styles.table}>
          <thead><tr><th>{t.reports.code}</th><th>{t.reports.accountName}</th><th className={styles.right}>{t.reports.balance}</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td className={styles.right}>{formatRupiah(row.balance)}</td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td colSpan={2}>{t.reports.total}</td>
              <td className={styles.right}>{formatRupiah(total)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
