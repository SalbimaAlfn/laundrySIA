import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { requireRole } from "@/server/auth";
import styles from "@/components/reports/reports.module.css";

export default async function ReportsPage() {
  await requireRole("MANAGER");
  const t = getDictionary();
  const reports = [
    { type: "income-statement", title: t.reports.incomeStatement, description: t.reports.summaryIncome },
    { type: "cash-flow", title: t.reports.cashFlow, description: t.reports.summaryCash },
    { type: "balance-sheet", title: t.reports.balanceSheet, description: t.reports.summaryBalance },
    { type: "sales", title: t.reports.sales, description: t.reports.summarySales },
    { type: "ledger", title: t.reports.ledger, description: t.reports.summaryLedger },
    { type: "trial-balance", title: t.reports.trialBalance, description: t.reports.summaryTrial },
  ];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t.reports.title}</h1>
          <p className={styles.lead}>{t.reports.lead}</p>
        </div>
      </header>
      <div className={styles.links}>
        {reports.map((report) => (
          <Link key={report.type} href={`/reports/${report.type}`} className={styles.link}>
            <strong>{report.title}</strong>
            <span>{report.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
