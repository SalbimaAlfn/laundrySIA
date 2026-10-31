"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReceivePaymentDialog } from "@/components/orders/receive-payment-dialog";
import { getDictionary } from "@/lib/i18n";
import { formatRupiah } from "@/lib/money";
import type { ReceivableOrder } from "@/server/orders/queries";
import styles from "./receivables-manager.module.css";

export function ReceivablesManager({
  orders,
  total,
}: {
  orders: ReceivableOrder[];
  total: number;
}) {
  const t = getDictionary();
  const [payment, setPayment] = useState<{ order: ReceivableOrder; submissionId: string } | null>(null);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t.nav.receivables}</h1>
          <p>{t.receivables.totalOwed}</p>
        </div>
        <strong className={styles.total}>{formatRupiah(total)}</strong>
      </header>

      {orders.length === 0 ? (
        <p className={styles.empty}>{t.receivables.empty}</p>
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order.id} className={styles.row}>
              <div className={styles.customer}>
                <Link href={`/orders/${order.id}`} className={styles.name}>{order.customerName}</Link>
                <span>{order.invoiceNo}</span>
              </div>
              <div className={styles.age}>
                {order.daysOpen} {t.receivables.days}
              </div>
              <strong className={styles.balance}>{formatRupiah(order.balance)}</strong>
              <Button
                variant="secondary"
                onClick={() => setPayment({ order, submissionId: crypto.randomUUID() })}
              >
                {t.orders.receivePayment}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {payment ? (
        <ReceivePaymentDialog
          key={payment.submissionId}
          orderId={payment.order.id}
          balance={payment.order.balance}
          submissionId={payment.submissionId}
          onClose={() => setPayment(null)}
        />
      ) : null}
    </section>
  );
}
