"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { getDictionary } from "@/lib/i18n";
import { formatRupiah } from "@/lib/money";
import { receivePaymentAction, type ReceivePaymentState } from "@/server/actions/payments";
import type { ReceivedPayment } from "@/server/payments/receive-payment";
import { useToast } from "@/components/ui/toast";
import styles from "./receive-payment-dialog.module.css";

const initialState: ReceivePaymentState = { status: "idle" };

export function ReceivePaymentDialog({
  orderId,
  balance,
  submissionId,
  onClose,
  onSuccess,
}: {
  orderId: number;
  balance: number;
  submissionId: string;
  onClose: () => void;
  onSuccess?: (payment: ReceivedPayment) => void;
}) {
  const t = getDictionary();
  const { show } = useToast();
  const [amount, setAmount] = useState<number | null>(balance);
  const [method, setMethod] = useState<"CASH" | "TRANSFER" | "EWALLET">("CASH");
  const [state, formAction, pending] = useActionState(receivePaymentAction, initialState);
  const handled = useRef(false);
  const amountId = `receive-payment-amount-${orderId}`;
  const methodId = `receive-payment-method-${orderId}`;
  const amountError = amount !== null && amount > balance
    ? t.validation.paymentTooMuch
    : amount === null || amount <= 0
      ? t.validation.amount
      : state.errors?.amount;

  useEffect(() => {
    if (state.status !== "success" || !state.payment || handled.current) return;
    handled.current = true;
    show(`${t.orders.paymentSaved} ${formatRupiah(state.payment.balance)}.`);
    onSuccess?.(state.payment);
    onClose();
  }, [onClose, onSuccess, show, state, t.orders.paymentSaved]);

  return (
    <Dialog
      open
      onClose={onClose}
      title={t.orders.receivePayment}
      closeLabel={t.common.closeDialog}
    >
      <form action={formAction} className={styles.form}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="amount" value={amount ?? ""} />
        <input type="hidden" name="idempotencyKey" value={submissionId} />
        {state.errors?.form ? <p className={styles.formError} role="alert">{state.errors.form}</p> : null}
        {state.errors?.orderId ? <p className={styles.formError} role="alert">{state.errors.orderId}</p> : null}
        <Field htmlFor={amountId} label={t.orders.amount} error={amountError}>
          <MoneyInput
            id={amountId}
            value={amount}
            onChange={setAmount}
            disabled={pending}
            aria-invalid={Boolean(amountError)}
          />
        </Field>
        <Button
          type="button"
          variant="text"
          className={styles.payFull}
          onClick={() => setAmount(balance)}
          disabled={pending}
        >
          {t.orderForm.payInFull} · {formatRupiah(balance)}
        </Button>
        <Field htmlFor={methodId} label={t.orderForm.method} error={state.errors?.method}>
          <Select
            id={methodId}
            name="method"
            value={method}
            onChange={(event) => setMethod(event.target.value as typeof method)}
            disabled={pending}
          >
            <option value="CASH">{t.orderForm.cash}</option>
            <option value="TRANSFER">{t.orderForm.transfer}</option>
            <option value="EWALLET">{t.orderForm.ewallet}</option>
          </Select>
        </Field>
        <div className={styles.actions}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={pending} disabled={amount === null || amount <= 0 || amount > balance}>
            {t.orders.receivePayment}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
