"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleCheck, Package, Truck, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { advanceStatusAction, reverseStatusAction } from "@/server/actions/orders";
import type { OrderDetail } from "@/server/orders/queries";
import styles from "./order-detail.module.css";

type OrderDetailProps = {
  order: OrderDetail;
};

export function OrderDetailView({ order }: OrderDetailProps) {
  const t = getDictionary();
  const { show } = useToast();
  const [isPending, startTransition] = useTransition();

  const statusSteps = [
    { key: "RECEIVED", label: t.orders.statusReceived, icon: Package },
    { key: "WASHING", label: t.orders.statusWashing, icon: WashingMachine },
    { key: "DRYING_IRONING", label: t.orders.statusDrying, icon: Truck },
    { key: "READY", label: t.orders.statusReady, icon: CircleCheck },
    { key: "COMPLETED", label: t.orders.statusCompleted, icon: Check },
  ];

  const currentIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isVoid = Boolean(order.voidedAt);
  const canAdvance = !isVoid && order.status !== "COMPLETED";
  const canReverse = !isVoid && order.status !== "RECEIVED" && order.status !== "COMPLETED";

  function handleAdvance() {
    startTransition(async () => {
      if (!(await advanceStatusAction(order.id))) return;
      show(t.orders.statusAdvanced);
      window.location.reload();
    });
  }

  function handleReverse() {
    startTransition(async () => {
      if (!(await reverseStatusAction(order.id))) return;
      show(t.orders.statusReversed);
      window.location.reload();
    });
  }

  return (
    <section className={styles.page}>
      <Link href="/orders" className={styles.backLink}>
        <ArrowLeft aria-hidden="true" size={16} />
        {t.orders.backToList}
      </Link>

      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.invoice}>{order.invoiceNo}</h1>
          <span className={cn(styles.statusBadge, styles[order.status.toLowerCase()])}>
            {t.orders[`status${order.status}` as keyof typeof t.orders] || order.status}
          </span>
        </div>
        <p className={styles.date}>
          {new Date(order.createdAt).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Progress Track */}
      {!isVoid && (
        <div className={styles.progress}>
          {statusSteps.map((step, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;
            return (
              <div key={step.key} className={styles.progressStep}>
                <div
                  className={cn(
                    styles.progressCircle,
                    isDone && styles.done,
                    isCurrent && styles.current,
                  )}
                >
                  <Icon aria-hidden="true" size={18} />
                </div>
                <span className={cn(styles.progressLabel, (isDone || isCurrent) && styles.active)}>
                  {step.label}
                </span>
                {index < statusSteps.length - 1 && (
                  <div
                    className={cn(
                      styles.progressLine,
                      isDone && styles.lineDone,
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.grid}>
        {/* Main Content */}
        <div className={styles.main}>
          {/* Customer Info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{t.orders.customer}</h2>
            <p className={styles.customerName}>{order.customer.name}</p>
            <p className={styles.customerPhone}>{order.customer.phone}</p>
          </div>

          {/* Items */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{t.orders.items}</h2>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>{t.orders.service}</th>
                  <th className={styles.right}>{t.orders.qty}</th>
                  <th className={styles.right}>{t.orders.unitPrice}</th>
                  <th className={styles.right}>{t.orders.total}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.serviceName}
                      <span className={styles.unitLabel}>
                        {item.unit === "KG" ? t.orderForm.kg : t.orderForm.piece}
                      </span>
                    </td>
                    <td className={styles.right}>{item.quantity}</td>
                    <td className={styles.right}>{formatRupiah(item.unitPrice)}</td>
                    <td className={styles.right}>{formatRupiah(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>{t.orders.subtotal}</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className={styles.totalRow}>
                  <span>{t.orders.discount}</span>
                  <span>−{formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <strong>{t.orders.total}</strong>
                <strong>{formatRupiah(order.total)}</strong>
              </div>
            </div>
          </div>

          {/* Payments */}
          {order.payments.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>{t.orders.payments}</h2>
              <table className={styles.paymentsTable}>
                <thead>
                  <tr>
                    <th>{t.orders.date}</th>
                    <th>{t.orders.method}</th>
                    <th className={styles.right}>{t.orders.amount}</th>
                    <th>{t.orders.receivedBy}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        {new Date(payment.paidAt).toLocaleDateString("id-ID")}
                      </td>
                      <td>{t.orders[`method${payment.method}` as keyof typeof t.orders]}</td>
                      <td className={styles.right}>{formatRupiah(payment.amount)}</td>
                      <td>{payment.receivedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Balance Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{t.orders.summary}</h2>
            <div className={styles.balanceRows}>
              <div className={styles.balanceRow}>
                <span>{t.orders.total}</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
              <div className={styles.balanceRow}>
                <span>{t.orders.paid}</span>
                <span>{formatRupiah(order.paid)}</span>
              </div>
              <div className={cn(styles.balanceRow, styles.grandBalance)}>
                <span>{t.orders.balance}</span>
                <span>
                  {order.balance === 0 ? (
                    <span className={styles.paidLabel}>{t.orders.settled}</span>
                  ) : (
                    formatRupiah(order.balance)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Pickup Date */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{t.orders.pickupDate}</h2>
            <p className={styles.pickupDate}>
              {new Date(order.pickupDate).toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>

          {/* Note */}
          {order.note && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>{t.orders.note}</h2>
              <p className={styles.note}>{order.note}</p>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {canAdvance && (
              <Button onClick={handleAdvance} disabled={isPending} className={styles.advanceButton}>
                <Check aria-hidden="true" size={16} />
                {t.orders.advanceStatus}
              </Button>
            )}
            {canReverse && (
              <Button
                variant="secondary"
                onClick={handleReverse}
                disabled={isPending}
              >
                {t.orders.reverseStatus}
              </Button>
            )}
            {order.balance > 0 && !isVoid && (
              <Link href={`/orders/${order.id}/receive`}>
                <Button variant="secondary" className={styles.receiveButton}>
                  {t.orders.receivePayment}
                </Button>
              </Link>
            )}
          </div>

          {/* Void Info */}
          {isVoid && (
            <div className={styles.voidInfo}>
              <p className={styles.voidLabel}>{t.orders.voided}</p>
              <p>{order.voidReason}</p>
              {order.voidedBy && <p>{t.orders.voidedBy}: {order.voidedBy}</p>}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
