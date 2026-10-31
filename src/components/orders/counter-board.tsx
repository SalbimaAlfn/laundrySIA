"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, CircleCheck, Package, PackageCheck, Truck, WashingMachine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ReceivePaymentDialog } from "@/components/orders/receive-payment-dialog";
import { formatQuantity, formatRupiah, toHundredths } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { advanceStatusAction } from "@/server/actions/orders";
import type { CounterOrder } from "@/server/orders/queries";
import styles from "./counter-board.module.css";

const statuses = ["RECEIVED", "WASHING", "DRYING_IRONING", "READY", "COMPLETED"] as const;

export function CounterBoard({ orders }: { orders: CounterOrder[] }) {
  const t = getDictionary();
  const { show } = useToast();
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>(statuses[0]);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<{ order: CounterOrder; submissionId: string } | null>(null);
  const [overrideOrder, setOverrideOrder] = useState<{ order: CounterOrder; submissionId: string; note: string; error: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const columns = [
    { status: statuses[0], label: t.orders.statusReceived, icon: Package },
    { status: statuses[1], label: t.orders.statusWashing, icon: WashingMachine },
    { status: statuses[2], label: t.orders.statusDrying, icon: Truck },
    { status: statuses[3], label: t.orders.statusReady, icon: PackageCheck },
    { status: statuses[4], label: t.orders.statusCompleted, icon: CircleCheck },
  ];
  const readyCount = orders.filter((order) => order.status === "READY").length;

  function handleAdvance(order: CounterOrder) {
    // Check if advancing would lead to COMPLETED with balance
    const currentIndex = statuses.indexOf(order.status);
    const nextStatus = statuses[currentIndex + 1];
    const willBeCompleted = nextStatus === "COMPLETED";
    const hasBalance = order.balance > 0;

    if (willBeCompleted && hasBalance) {
      // Show override dialog - manager can override, cashier cannot
      setOverrideOrder({ order, submissionId: crypto.randomUUID(), note: "", error: "" });
      return;
    }

    setPendingOrderId(order.id);
    startTransition(async () => {
      const result = await advanceStatusAction(order.id);
      if (result.ok) {
        show(t.orders.statusAdvanced);
      } else {
        show(result.error || t.common.genericError);
      }
      setPendingOrderId(null);
    });
  }

  function handleOverrideConfirm() {
    if (!overrideOrder) return;
    if (!overrideOrder.note.trim()) {
      setOverrideOrder(prev => prev ? { ...prev, error: t.orders.overrideNoteRequired || "Catatan override wajib diisi." } : null);
      return;
    }

    const { order, note } = overrideOrder;
    setOverrideOrder(null);
    startTransition(async () => {
      const result = await advanceStatusAction(order.id, note.trim());
      if (result.ok) {
        show(t.orders.statusAdvanced);
      } else {
        show(result.error || t.common.genericError);
      }
    });
  }

  function handleOverrideCancel() {
    setOverrideOrder(null);
  }

  function handleOverrideNoteChange(note: string) {
    setOverrideOrder(prev => prev ? { ...prev, note, error: "" } : null);
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t.nav.counter}</h1>
          <p>
            {t.counterBoard.activeOrders}: <strong>{orders.length}</strong>
            <span aria-hidden="true"> · </span>
            {t.counterBoard.readyOrders}: <strong>{readyCount}</strong>
          </p>
        </div>
        <Link href="/orders/new" className={styles.newOrderLink}>
          <Button>{t.orderForm.newOrder}</Button>
        </Link>
      </header>

      <div className={styles.tabs} role="tablist" aria-label={t.orders.status}>
        {columns.map(({ status, label }) => {
          const count = orders.filter((order) => order.status === status).length;
          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={activeStatus === status}
              aria-controls={`counter-column-${status}`}
              className={activeStatus === status ? styles.activeTab : styles.tab}
              onClick={() => setActiveStatus(status)}
            >
              {label} <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.columns}>
        {columns.map(({ status, label, icon: Icon }) => {
          const columnOrders = orders.filter((order) => order.status === status);
          return (
            <section
              key={status}
              id={`counter-column-${status}`}
              role="tabpanel"
              aria-label={label}
              className={status === activeStatus ? styles.column : `${styles.column} ${styles.inactiveColumn}`}
            >
              <h2 className={styles.columnHeading}>
                <Icon aria-hidden="true" size={18} />
                {label} <span>{columnOrders.length}</span>
              </h2>
              {columnOrders.length === 0 ? (
                <p className={styles.empty}>{t.counterBoard.emptyColumn}</p>
              ) : (
                <div className={styles.cards}>
                  {columnOrders.map((order) => (
                    <article key={order.id} className={`${styles.card} ${styles[status]}`}>
                      <div className={styles.cardHeader}>
                        <Link href={`/orders/${order.id}`} className={styles.invoice}>
                          {order.invoiceNo}
                        </Link>
                        <span className={styles.cardStatus}>
                          <Icon aria-hidden="true" size={14} /> {label}
                        </span>
                      </div>
                      <p className={styles.customer}>{order.customerName}</p>
                      <ul className={styles.items}>
                        {order.items.map((item, index) => (
                          <li key={`${item.serviceName}-${index}`}>
                            {item.serviceName} · {formatQuantity(toHundredths(item.quantity) ?? 0)} {item.unit === "KG" ? t.orderForm.kg : t.orderForm.piece}
                          </li>
                        ))}
                      </ul>
                      {order.balance > 0 ? (
                        <p className={styles.balance}>
                          {t.counterBoard.leftToPay}: <strong>{formatRupiah(order.balance)}</strong>
                        </p>
                      ) : (
                        <p className={styles.paid}>{t.orders.settled}</p>
                      )}
                      {order.balance > 0 ? (
                        <Button
                          variant="secondary"
                          className={styles.advance}
                          onClick={() => setPaymentOrder({ order, submissionId: crypto.randomUUID() })}
                        >
                          {t.orders.receivePayment}
                        </Button>
                      ) : null}
                      {status !== "COMPLETED" ? (
                        <Button
                          variant="secondary"
                          className={styles.advance}
                          disabled={pending}
                          loading={pending && pendingOrderId === order.id}
                          onClick={() => handleAdvance(order)}
                        >
                          <Check aria-hidden="true" size={16} /> {t.orders.advanceStatus}
                        </Button>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {paymentOrder ? (
        <ReceivePaymentDialog
          key={paymentOrder.submissionId}
          orderId={paymentOrder.order.id}
          balance={paymentOrder.order.balance}
          submissionId={paymentOrder.submissionId}
          onClose={() => setPaymentOrder(null)}
        />
      ) : null}
      {overrideOrder && (
        <div
          className={styles.overrideDialogOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="override-dialog-title"
        >
          <div className={styles.overrideDialog}>
            <h2 id="override-dialog-title" className={styles.overrideDialogTitle}>
              <AlertCircle aria-hidden="true" size={20} /> {t.orders.overrideTitle || "Override Selesai"}
            </h2>
            <p className={styles.overrideDialogMessage}>
              {t.orders.overrideMessage || "Pesanan ini masih memiliki sisa tagihan"} <strong>{formatRupiah(overrideOrder.order.balance)}</strong>.
              {t.orders.overrideMessage2 || "Hanya manajer yang dapat memaksa status Selesai dengan catatan."}
            </p>
            <label htmlFor="override-note" className={styles.overrideLabel}>
              {t.orders.overrideNoteLabel || "Catatan override (wajib)"}
            </label>
            <textarea
              id="override-note"
              className={styles.overrideTextarea}
              value={overrideOrder.note}
              onChange={(e) => handleOverrideNoteChange(e.target.value)}
              placeholder={t.orders.overrideNotePlaceholder || "Masukkan alasan memaksa selesai..."}
              rows={3}
              maxLength={200}
              disabled={pending}
            />
            {overrideOrder.error && <p className={styles.overrideError}>{overrideOrder.error}</p>}
            <div className={styles.overrideDialogActions}>
              <Button variant="secondary" onClick={handleOverrideCancel} disabled={pending}>
                {t.common.cancel}
              </Button>
              <Button variant="danger" onClick={handleOverrideConfirm} disabled={pending} loading={pending}>
                {t.orders.overrideConfirm || "Konfirmasi override"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
