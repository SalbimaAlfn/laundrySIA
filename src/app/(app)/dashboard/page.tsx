import Link from "next/link";
import { businessDate } from "@/lib/dates";
import { getDictionary } from "@/lib/i18n";
import { formatRupiah } from "@/lib/money";
import { requireRole } from "@/server/auth";
import { dashboardData } from "@/server/reports/queries";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  await requireRole("MANAGER");
  const t = getDictionary();
  const data = await dashboardData(businessDate());
  const maxBar = Math.max(data.earnedToday, data.receivedToday, 1);
  const maxRevenue = Math.max(...data.revenue7Days.map((row) => row.revenue), 1);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t.dashboard.title}</h1>
        <p className={styles.lead}>{t.dashboard.chartLabel}</p>
      </header>

      <div className={styles.cards}>
        <div className={styles.card}><span>{t.dashboard.earnedToday}</span><strong>{formatRupiah(data.earnedToday)}</strong></div>
        <div className={styles.card}><span>{t.dashboard.receivedToday}</span><strong>{formatRupiah(data.receivedToday)}</strong></div>
        <div className={styles.card}><span>{t.dashboard.toCollect}</span><strong>{formatRupiah(data.toCollect)}</strong></div>
        <div className={styles.card}><span>{t.dashboard.readyOrders}</span><strong>{data.readyOrders.length}</strong></div>
      </div>

      <div className={styles.bars}>
        <div className={styles.barRow}>
          <span>{t.dashboard.earnedToday}</span>
          <div className={styles.track}><div className={styles.fill} style={{ width: `${(data.earnedToday / maxBar) * 100}%` }} /></div>
          <strong>{formatRupiah(data.earnedToday)}</strong>
        </div>
        <div className={styles.barRow}>
          <span>{t.dashboard.receivedToday}</span>
          <div className={styles.track}><div className={`${styles.fill} ${styles.received}`} style={{ width: `${(data.receivedToday / maxBar) * 100}%` }} /></div>
          <strong>{formatRupiah(data.receivedToday)}</strong>
        </div>
      </div>

      <div className={styles.chart} role="img" aria-label={t.dashboard.chartLabel}>
        {data.revenue7Days.map((row, index) => (
          <div key={row.day} className={styles.chartBar} title={`${row.day}: ${formatRupiah(row.revenue)}`}>
            <span>{row.day.slice(5)}</span>
            <div
              className={index === data.revenue7Days.length - 1 ? styles.today : undefined}
              style={{ height: `${Math.max(2, (row.revenue / maxRevenue) * 120)}px` }}
            />
          </div>
        ))}
      </div>
      <p className={styles.muted}>{t.dashboard.last7Days}</p>

      <div className={styles.panels}>
        <div className={styles.panel}>
          <h2>{t.dashboard.toCollect}</h2>
          {data.toCollectOrders.length === 0 ? (
            <p className={styles.muted}>{t.dashboard.noCollect}</p>
          ) : (
            <ul className={styles.list}>
              {data.toCollectOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/orders/${order.id}`} className={styles.link}>{order.invoiceNo}</Link>
                  <span>{order.customerName} · {formatRupiah(order.balance)}</span>
                </li>
              ))}
            </ul>
          )}
          <p><strong>{formatRupiah(data.toCollect)}</strong></p>
          <Link href="/receivables" className={styles.link}>{t.dashboard.viewAll}</Link>
        </div>

        <div className={styles.panel}>
          <h2>{t.dashboard.lowStock}</h2>
          {data.lowStock.length === 0 ? <p className={styles.muted}>{t.dashboard.noLowStock}</p> : (
            <ul className={styles.list}>
              {data.lowStock.map((supply) => (
                <li key={supply.id}>
                  <span>{supply.name}</span>
                  <span>{supply.stockQty.toFixed(2)} / {supply.minQty.toFixed(2)} {supply.unit}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/stock" className={styles.link}>{t.dashboard.viewAll}</Link>
        </div>

        <div className={styles.panel}>
          <h2>{t.dashboard.readyOrders}</h2>
          {data.readyOrders.length === 0 ? <p className={styles.muted}>{t.dashboard.noReady}</p> : (
            <ul className={styles.list}>
              {data.readyOrders.slice(0, 5).map((order) => (
                <li key={order.id}>
                  <Link href={`/orders/${order.id}`} className={styles.link}>{order.invoiceNo}</Link>
                  <span>{order.customerName}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/counter" className={styles.link}>{t.dashboard.viewAll}</Link>
        </div>
      </div>
    </section>
  );
}
