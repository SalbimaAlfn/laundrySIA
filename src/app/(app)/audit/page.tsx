import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { requireRole } from "@/server/auth";
import { getAuditFilterOptions, getAuditLogs } from "@/server/audit-queries";
import styles from "@/components/reports/reports.module.css";

type AuditPageProps = {
  searchParams: Promise<{ userId?: string; action?: string; from?: string; to?: string }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireRole("MANAGER");
  const query = await searchParams;
  const t = getDictionary();
  const userId = Number(query.userId) || undefined;
  const [logs, options] = await Promise.all([
    getAuditLogs({ userId, action: query.action, from: query.from, to: query.to }),
    getAuditFilterOptions(),
  ]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t.audit.title}</h1>
          <p className={styles.lead}>{t.audit.lead}</p>
        </div>
      </header>

      <form className={styles.filters} method="get">
        <label>
          {t.audit.user}
          <select name="userId" defaultValue={query.userId ?? ""}>
            <option value="">{t.audit.allUsers}</option>
            {options.users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </label>
        <label>
          {t.audit.action}
          <select name="action" defaultValue={query.action ?? ""}>
            <option value="">{t.audit.allActions}</option>
            {options.actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </label>
        <label>
          {t.audit.from}
          <input type="date" name="from" defaultValue={query.from ?? ""} />
        </label>
        <label>
          {t.audit.to}
          <input type="date" name="to" defaultValue={query.to ?? ""} />
        </label>
        <button type="submit" style={{ minHeight: "var(--field-h)", padding: "0 var(--s-4)" }}>
          {t.audit.filter}
        </button>
        <Link href="/audit" style={{ alignSelf: "center" }}>{t.audit.clear}</Link>
      </form>

      <div className={styles.section}>
        {logs.length === 0 ? <p>{t.audit.empty}</p> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.audit.date}</th>
                <th>{t.audit.user}</th>
                <th>{t.audit.action}</th>
                <th>{t.audit.entity}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString("id-ID")}</td>
                  <td>{log.userName}</td>
                  <td>{log.action}</td>
                  <td>{log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
