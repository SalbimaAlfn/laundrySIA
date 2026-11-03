"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CircleCheck, Package, Truck, WashingMachine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import { ClaimTicket, type PrintSize } from "@/components/orders/claim-ticket";
import { ReceivePaymentDialog } from "@/components/orders/receive-payment-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { advanceStatusAction, reverseStatusAction, voidOrderAction } from "@/server/actions/orders";
import type { OrderDetail } from "@/server/orders/queries";
import styles from "./order-detail.module.css";

type OrderDetailProps = {
  order: OrderDetail;
  canReverseStatus: boolean;
  shopName: string;
  shopAddress: string | null;
};

export function OrderDetailView({ order, canReverseStatus, shopName, shopAddress }: OrderDetailProps) {
  const t = getDictionary();
  const { show } = useToast();
  const [isPending, startTransition] = useTransition();
  const [printSize, setPrintSize] = useState<PrintSize>("thermal");
  const [paymentSubmissionId, setPaymentSubmissionId] = useState<string | null>(null);
  const [animatePaid, setAnimatePaid] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideError, setOverrideError] = useState("");
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState("");

  const statusSteps = [
    { key: "RECEIVED", label: t.orders.statusReceived, icon: Package },
    { key: "WASHING", label: t.orders.statusWashing, icon: WashingMachine },
    { key: "DRYING_IRONING", label: t.orders.statusDrying, icon: Truck },
    { key: "READY", label: t.orders.statusReady, icon: CircleCheck },
    { key: "COMPLETED", label: t.orders.statusCompleted, icon: Check },
  ];

  const currentIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isVoid = Boolean(order.voidedAt);
  const nextStatus = statusSteps[currentIndex + 1];
  const canAdvance = !isVoid && order.status !== "COMPLETED";
  const willBeCompleted = canAdvance && nextStatus?.key === "COMPLETED";
  const hasBalance = order.balance > 0;
  const canReverse = canReverseStatus && !isVoid && order.status !== "RECEIVED" && order.status !== "COMPLETED";
  const isManager = canReverseStatus; // manager can reverse, so they're a manager

  function handleAdvance() {
    // If advancing to COMPLETED with balance, show override dialog for managers
    if (willBeCompleted && hasBalance) {
      if (isManager) {
        setOverrideNote("");
        setOverrideError("");
        setShowOverrideDialog(true);
      } else {
        show(t.orders.balanceRemainsError || "Order has remaining balance. Only a manager can override.");
      }
      return;
    }

    startTransition(async () => {
      const result = await advanceStatusAction(order.id);
      if (!result.ok) {
        if (result.error === "noteRequired") {
          setOverrideError(t.orders.overrideNoteRequired || "Catatan override wajib diisi.");
          setShowOverrideDialog(true);
        } else if (result.error === "managerRequired") {
          show(t.orders.managerRequiredError || "Hanya manajer yang dapat mengoverride saldo tersisa.");
        }
        return;
      }
      show(t.orders.statusAdvanced);
      window.location.reload();
    });
  }

  function handleOverrideConfirm() {
    if (!overrideNote.trim()) {
      setOverrideError(t.orders.overrideNoteRequired || "Catatan override wajib diisi.");
      return;
    }
    setShowOverrideDialog(false);
    startTransition(async () => {
      const result = await advanceStatusAction(order.id, overrideNote.trim());
      if (!result.ok) {
        if (result.error === "noteRequired") {
          setOverrideError(t.orders.overrideNoteRequired || "Catatan override wajib diisi.");
          setShowOverrideDialog(true);
        } else {
          show(result.error || t.common.genericError);
        }
        return;
      }
      show(t.orders.statusAdvanced);
      window.location.reload();
    });
  }

  function handleOverrideCancel() {
    setShowOverrideDialog(false);
    setOverrideNote("");
    setOverrideError("");
  }

  function handleReverse() {
    startTransition(async () => {
      const result = await reverseStatusAction(order.id);
      if (!result.ok) {
        show(result.error || t.common.genericError);
        return;
      }
      show(t.orders.statusReversed);
      window.location.reload();
    });
  }

  function handleVoidConfirm() {
    if (voidReason.trim().length < 5) {
      setVoidError(t.orders.voidReasonLabel);
      return;
    }
    startTransition(async () => {
      const result = await voidOrderAction(order.id, voidReason.trim());
      if (!result.ok) {
        if (result.error === "alreadyVoided") setVoidError(t.orders.alreadyVoided);
        else setVoidError(result.error || t.common.genericError);
        return;
      }
      show(t.orders.voidedSuccess);
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
          <span className={cn(styles.statusBadge, styles[isVoid ? "void" : order.status.toLowerCase()])}>
            {isVoid ? t.orders.statusVoid : t.orders[`status${order.status}` as keyof typeof t.orders] || order.status}
          </span>
        </div>
        {isVoid ? <p className={styles.voidStamp}>{t.orders.statusVoid}</p> : null}
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
          <div className={styles.ticketPanel}>
            <ClaimTicket
              shopName={shopName}
              shopAddress={shopAddress}
              invoiceNo={order.invoiceNo}
              date={order.pickupDate}
              customerName={order.customer.name}
              items={order.items.map((item) => ({
                name: item.serviceName,
                unit: item.unit,
                quantity: item.quantity,
                total: item.lineTotal,
              }))}
              subtotal={order.subtotal}
              discount={order.discount}
              total={order.total}
              paidNow={order.paid}
              leftToPay={order.balance}
              placeholder={order.invoiceNo}
              voided={isVoid}
              printSize={printSize}
              animatePaid={animatePaid}
            />
            <div className={styles.printActions}>
              <label htmlFor="detail-ticket-size">{t.orderForm.printSize}</label>
              <Select id="detail-ticket-size" value={printSize} onChange={(event) => setPrintSize(event.target.value as PrintSize)}>
                <option value="thermal">{t.orderForm.thermal}</option>
                <option value="a5">{t.orderForm.a5}</option>
              </Select>
              <Button variant="secondary" onClick={() => window.print()}>
                {t.orderForm.print}
              </Button>
            </div>
          </div>

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
              <Button
                variant="secondary"
                className={styles.receiveButton}
                onClick={() => setPaymentSubmissionId(crypto.randomUUID())}
              >
                {t.orders.receivePayment}
              </Button>
            )}
            {isManager && !isVoid && (
              <Button variant="danger" onClick={() => { setVoidReason(""); setVoidError(""); setShowVoidDialog(true); }}>
                {t.orders.voidOrder}
              </Button>
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
      {paymentSubmissionId ? (
        <ReceivePaymentDialog
          key={paymentSubmissionId}
          orderId={order.id}
          balance={order.balance}
          submissionId={paymentSubmissionId}
          onClose={() => setPaymentSubmissionId(null)}
          onSuccess={(payment) => setAnimatePaid(payment.balance === 0)}
        />
      ) : null}
      <Dialog
        open={showVoidDialog}
        onClose={() => setShowVoidDialog(false)}
        title={t.orders.voidTitle}
        closeLabel={t.common.closeDialog}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowVoidDialog(false)} disabled={isPending}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={handleVoidConfirm} loading={isPending}>
              {t.orders.voidConfirm}
            </Button>
          </>
        }
      >
        <p>
          {t.orders.voidWarning} <strong>{formatRupiah(order.paid)}</strong>
        </p>
        <label htmlFor="void-reason" className={styles.overrideLabel}>
          {t.orders.voidReasonLabel}
        </label>
        <textarea
          id="void-reason"
          className={styles.overrideTextarea}
          value={voidReason}
          onChange={(event) => { setVoidReason(event.target.value); setVoidError(""); }}
          placeholder={t.orders.voidReasonPlaceholder}
          rows={3}
          maxLength={200}
          disabled={isPending}
        />
        {voidError && <p className={styles.overrideError}>{voidError}</p>}
      </Dialog>
      {showOverrideDialog && (
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
              {t.orders.overrideMessage || "Pesanan ini masih memiliki sisa tagihan"} <strong>{formatRupiah(order.balance)}</strong>.
              {t.orders.overrideMessage2 || "Hanya manajer yang dapat memaksa status Selesai dengan catatan."}
            </p>
            <label htmlFor="override-note" className={styles.overrideLabel}>
              {t.orders.overrideNoteLabel || "Catatan override (wajib)"}
            </label>
            <textarea
              id="override-note"
              className={styles.overrideTextarea}
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              placeholder={t.orders.overrideNotePlaceholder || "Masukkan alasan memaksa selesai..."}
              rows={3}
              maxLength={200}
              disabled={isPending}
            />
            {overrideError && <p className={styles.overrideError}>{overrideError}</p>}
            <div className={styles.overrideDialogActions}>
              <Button variant="secondary" onClick={handleOverrideCancel} disabled={isPending}>
                {t.common.cancel}
              </Button>
              <Button variant="danger" onClick={handleOverrideConfirm} disabled={isPending} loading={isPending}>
                {t.orders.overrideConfirm || "Konfirmasi override"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
