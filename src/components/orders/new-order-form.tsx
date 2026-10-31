"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSearch, type CustomerOption } from "@/components/customers/customer-search";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { getDictionary } from "@/lib/i18n";
import { addBusinessDays } from "@/lib/dates";
import { formatQuantity, formatRupiah, lineTotal, sumRupiah, toHundredths } from "@/lib/money";
import { MAX_MONEY, MAX_ORDER_ITEMS } from "@/lib/limits";
import { createOrderAction, type CreateOrderState } from "@/server/actions/orders";
import type { CreatedOrder } from "@/server/orders/create-order";
import { ClaimTicket, type PrintSize } from "@/components/orders/claim-ticket";
import styles from "./new-order-form.module.css";

type ServiceOption = {
  id: number;
  name: string;
  unit: "KG" | "PIECE";
  price: number;
  turnaroundDays: number;
};

type DraftItem = {
  rowId: number;
  serviceId: number | null;
  quantity: string;
};

type NewOrderFormProps = {
  services: ServiceOption[];
  shopName: string;
  shopAddress: string | null;
  today: string;
  initialPickupDate: string;
  initialSubmissionId: string;
};

const initialState: CreateOrderState = { status: "idle" };

function SavedTicket({
  order,
  customer,
  shopName,
  shopAddress,
}: {
  order: CreatedOrder;
  customer: CustomerOption;
  shopName: string;
  shopAddress: string | null;
}) {
  const t = getDictionary().orderForm;
  const router = useRouter();
  const [printSize, setPrintSize] = useState<PrintSize>("thermal");
  const paidNow = order.payment?.amount ?? 0;

  return (
    <section className={styles.saved}>
      <div className={styles.savedHeading}>
        <h1>{t.saved}</h1>
        <p>{order.invoiceNo}</p>
      </div>
      <ClaimTicket
        shopName={shopName}
        shopAddress={shopAddress}
        invoiceNo={order.invoiceNo}
        date={order.pickupDate}
        customerName={customer.name}
        items={order.items.map((item) => ({
          name: item.serviceName,
          unit: item.unit,
          quantity: formatQuantity(toHundredths(item.quantity) ?? 0),
          total: item.lineTotal,
        }))}
        subtotal={order.subtotal}
        discount={order.discount}
        total={order.total}
        paidNow={paidNow}
        leftToPay={order.total - paidNow}
        placeholder={order.invoiceNo}
        printSize={printSize}
        animatePaid
      />
      <div className={styles.savedActions}>
        <label className={styles.printSizeLabel} htmlFor="claim-ticket-size">
          {t.printSize}
        </label>
        <Select id="claim-ticket-size" value={printSize} onChange={(event) => setPrintSize(event.target.value as PrintSize)}>
          <option value="thermal">{t.thermal}</option>
          <option value="a5">{t.a5}</option>
        </Select>
        <Button variant="secondary" onClick={() => window.print()}>
          {t.print}
        </Button>
        <Button onClick={() => router.refresh()}>{t.newOrder}</Button>
      </div>
    </section>
  );
}

export function NewOrderForm({
  services,
  shopName,
  shopAddress,
  today,
  initialPickupDate,
  initialSubmissionId,
}: NewOrderFormProps) {
  const t = getDictionary();
  const f = t.orderForm;
  const [state, formAction, pending] = useActionState(createOrderAction, initialState);
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [items, setItems] = useState<DraftItem[]>([
    { rowId: 1, serviceId: null, quantity: "1" },
  ]);
  const [nextRowId, setNextRowId] = useState(2);
  const [discount, setDiscount] = useState<number | null>(0);
  const [paymentType, setPaymentType] = useState<"FULL" | "DEPOSIT" | "LATER">("FULL");
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "EWALLET">("CASH");
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [pickupTouched, setPickupTouched] = useState(false);
  const [submissionId] = useState(initialSubmissionId);
  const servicesById = new Map(services.map((service) => [service.id, service]));

  const pricedItems = items.map((item) => {
    const service = item.serviceId === null ? undefined : servicesById.get(item.serviceId);
    const quantityHundredths = toHundredths(item.quantity);
    return {
      ...item,
      service,
      quantityHundredths,
      total:
        service && quantityHundredths !== null ? lineTotal(service.price, quantityHundredths) : 0,
    };
  });
  const subtotal = sumRupiah(pricedItems.map((item) => item.total));
  const currentDiscount = discount ?? 0;
  const total = Math.max(0, subtotal - currentDiscount);
  const paidNow =
    paymentType === "FULL" ? total : paymentType === "DEPOSIT" ? (paymentAmount ?? 0) : 0;
  const leftToPay = Math.max(0, total - paidNow);
  const localDiscountError =
    currentDiscount > MAX_MONEY
      ? t.validation.amountTooLarge
      : currentDiscount > subtotal
        ? t.validation.discountExceedsSubtotal
        : undefined;
  const discountError = localDiscountError ?? state.errors?.discount;
  const localPaymentError =
    paymentType === "DEPOSIT"
      ? !paymentAmount || paymentAmount <= 0
        ? t.validation.depositAmount
        : paymentAmount > MAX_MONEY
          ? t.validation.amountTooLarge
          : paymentAmount >= total
            ? t.validation.depositMustBeLess
            : undefined
      : undefined;
  const paymentError = localPaymentError ?? state.errors?.paymentAmount;
  const ticketItems = pricedItems.flatMap((item) =>
    item.service && item.quantityHundredths !== null
      ? [
          {
            name: item.service.name,
            unit: item.service.unit,
            quantity: formatQuantity(item.quantityHundredths),
            total: item.total,
          },
        ]
      : [],
  );

  function updateService(rowId: number, serviceId: number | null) {
    const updated = items.map((item) => (item.rowId === rowId ? { ...item, serviceId } : item));
    setItems(updated);
    if (!pickupTouched) {
      const days = Math.max(
        0,
        ...updated.map((item) => servicesById.get(item.serviceId ?? -1)?.turnaroundDays ?? 0),
      );
      setPickupDate(addBusinessDays(today, days));
    }
  }

  function stepQuantity(rowId: number, unit: ServiceOption["unit"], direction: -1 | 1) {
    const step = unit === "KG" ? 50 : 100;
    setItems((current) =>
      current.map((item) => {
        if (item.rowId !== rowId) return item;
        const currentValue = toHundredths(item.quantity) ?? 0;
        return {
          ...item,
          quantity: formatQuantity(Math.max(step, currentValue + step * direction)),
        };
      }),
    );
  }

  function addItem() {
    const rowId = nextRowId;
    setNextRowId((value) => value + 1);
    setItems((current) => [
      ...current,
      { rowId, serviceId: null, quantity: "1" },
    ]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!customer || !services.length || items.some((item) => item.serviceId === null)) return;
    if (localDiscountError || localPaymentError) {
      event.preventDefault();
    }
  }

  const resultOrder = state.status === "success" ? state.order : undefined;
  if (resultOrder && customer) {
    return (
      <SavedTicket
        order={resultOrder}
        customer={customer}
        shopName={shopName}
        shopAddress={shopAddress}
      />
    );
  }

  return (
    <section className={styles.page}>
      <h1 className={styles.pageTitle}>{f.title}</h1>
      <form action={formAction} onSubmit={handleSubmit} className={styles.layout}>
        <div className={styles.formPanel}>
          {state.errors?.form ? (
            <p className={styles.formError} role="alert">
              {state.errors.form}
            </p>
          ) : null}

          <CustomerSearch label={f.customer} onSelect={setCustomer} disabled={pending} />
          <input type="hidden" name="customerId" value={customer?.id ?? ""} />
          {state.errors?.customerId && !customer ? (
            <p className={styles.fieldError}>{state.errors.customerId}</p>
          ) : null}

          <section className={styles.itemsSection} aria-labelledby="order-items-title">
            <h2 id="order-items-title" className={styles.sectionTitle}>
              {f.services}
            </h2>
            {items.map((item, index) => {
              const service = servicesById.get(item.serviceId ?? -1);
              const unit = service?.unit ?? "KG";
              const quantityError = state.errors?.items;
              return (
                <div className={styles.itemRow} key={item.rowId}>
                  <Field
                    htmlFor={`service-${item.rowId}`}
                    label={`${f.service} ${index + 1}`}
                    error={index === 0 ? quantityError : undefined}
                  >
                    <Select
                      value={item.serviceId ?? ""}
                      onChange={(event) =>
                        updateService(
                          item.rowId,
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      required
                      disabled={!services.length || pending}
                    >
                      <option value="">{f.chooseService}</option>
                      {services.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} · {formatRupiah(option.price)}/
                          {option.unit === "KG" ? f.kg : f.piece}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className={styles.quantityField}>
                    <label htmlFor={`quantity-${item.rowId}`} className={styles.inputLabel}>
                      {f.quantity}
                    </label>
                    <div className={styles.quantityControl}>
                      <button
                        type="button"
                        className={styles.stepButton}
                        aria-label={`${f.quantity} −`}
                        onClick={() => stepQuantity(item.rowId, unit, -1)}
                        disabled={pending}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <Input
                        id={`quantity-${item.rowId}`}
                        type="number"
                        inputMode="decimal"
                        min={unit === "KG" ? "0.01" : "1"}
                        max="999.99"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((draft) =>
                              draft.rowId === item.rowId
                                ? { ...draft, quantity: event.target.value }
                                : draft,
                            ),
                          )
                        }
                        aria-invalid={quantityError ? true : undefined}
                        disabled={pending}
                      />
                      <button
                        type="button"
                        className={styles.stepButton}
                        aria-label={`${f.quantity} +`}
                        onClick={() => stepQuantity(item.rowId, unit, 1)}
                        disabled={pending}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                      <span className={styles.unit}>{unit === "KG" ? f.kg : f.piece}</span>
                    </div>
                    {quantityError && index > 0 ? (
                      <p className={styles.fieldError}>{quantityError}</p>
                    ) : null}
                  </div>
                  <div className={styles.itemAmount}>
                    <span className={styles.inputLabel}>{f.lineTotal}</span>
                    <strong>{formatRupiah(pricedItems[index]?.total ?? 0)}</strong>
                    {service ? (
                      <small>
                        {f.unitPrice}: {formatRupiah(service.price)}
                      </small>
                    ) : null}
                  </div>
                  {items.length > 1 ? (
                    <button
                      className={styles.removeButton}
                      type="button"
                      aria-label={`${f.removeService} ${index + 1}`}
                      onClick={() =>
                        setItems((current) => current.filter((draft) => draft.rowId !== item.rowId))
                      }
                      disabled={pending}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              );
            })}
            {services.length && items.length < MAX_ORDER_ITEMS ? (
              <Button variant="secondary" size="sm" onClick={addItem} disabled={pending}>
                <Plus size={16} aria-hidden="true" /> {f.addService}
              </Button>
            ) : null}
            {!services.length ? <p className={styles.formHint}>{f.noServices}</p> : null}
            <input
              type="hidden"
              name="items"
              value={JSON.stringify(
                pricedItems.map(({ serviceId, quantityHundredths }) => ({
                  serviceId,
                  quantityHundredths,
                })),
              )}
            />
          </section>

          <div className={styles.fieldsGrid}>
            <Field
              htmlFor="order-pickup-date"
              label={f.pickupDate}
              error={state.errors?.pickupDate}
            >
              <Input
                name="pickupDate"
                type="date"
                min={today}
                value={pickupDate}
                onChange={(event) => {
                  setPickupDate(event.target.value);
                  setPickupTouched(true);
                }}
                required
                disabled={pending}
              />
            </Field>
            <Field htmlFor="order-note" label={f.note} error={state.errors?.note}>
              <Textarea
                name="note"
                maxLength={200}
                placeholder={f.notePlaceholder}
                disabled={pending}
              />
            </Field>
          </div>

          <section className={styles.paymentSection} aria-labelledby="payment-title">
            <h2 id="payment-title" className={styles.sectionTitle}>
              {f.paymentNow}
            </h2>
            <div className={styles.paymentChoices} role="radiogroup" aria-label={f.paymentNow}>
              {(
                [
                  ["FULL", f.payInFull],
                  ["DEPOSIT", f.deposit],
                  ["LATER", f.payLater],
                ] as const
              ).map(([value, label]) => (
                <label
                  className={
                    paymentType === value ? styles.paymentChoiceSelected : styles.paymentChoice
                  }
                  key={value}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value={value}
                    checked={paymentType === value}
                    onChange={() => setPaymentType(value)}
                    disabled={pending}
                  />
                  <span>{label}</span>
                  {paymentType === value ? <Check size={18} aria-hidden="true" /> : null}
                </label>
              ))}
            </div>
            <div className={styles.paymentFields}>
              {paymentType === "DEPOSIT" ? (
                <Field htmlFor="order-payment-amount" label={f.amount} error={paymentError}>
                  <MoneyInput
                    id="order-payment-amount"
                    value={paymentAmount}
                    onChange={setPaymentAmount}
                    disabled={pending}
                    placeholder="0"
                  />
                </Field>
              ) : null}
              <Field
                htmlFor="order-payment-method"
                label={f.method}
                error={state.errors?.paymentMethod}
              >
                <Select
                  id="order-payment-method"
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}
                  disabled={pending}
                >
                  <option value="CASH">{f.cash}</option>
                  <option value="TRANSFER">{f.transfer}</option>
                  <option value="EWALLET">{f.ewallet}</option>
                </Select>
              </Field>
            </div>
            <input
              type="hidden"
              name="paymentAmount"
              value={paymentType === "DEPOSIT" ? (paymentAmount ?? "") : ""}
            />
          </section>

          <div className={styles.summary}>
            <div className={styles.summaryLine}>
              <span>{f.subtotal}</span>
              <strong>{formatRupiah(subtotal)}</strong>
            </div>
            <Field htmlFor="order-discount" label={f.discount} error={discountError}>
              <MoneyInput
                id="order-discount"
                value={discount}
                onChange={setDiscount}
                disabled={pending}
                aria-invalid={discountError ? true : undefined}
              />
            </Field>
            <input type="hidden" name="discount" value={currentDiscount} />
            <div className={styles.grandTotal}>
              <span>{f.total}</span>
              <strong>{formatRupiah(total)}</strong>
            </div>
          </div>

          <input type="hidden" name="idempotencyKey" value={submissionId} />
          <div className={styles.formActions}>
            <Link href="/counter" className={styles.cancelLink}>
              {t.common.cancel}
            </Link>
            <Button type="submit" loading={pending} disabled={!services.length}>
              {f.saveOrder}
            </Button>
          </div>
        </div>

        <aside className={styles.preview}>
          <h2 className={styles.sectionTitle}>{f.ticket}</h2>
          <ClaimTicket
            shopName={shopName}
            shopAddress={shopAddress}
            invoiceNo={null}
            date={pickupDate}
            customerName={customer?.name ?? f.customer}
            items={ticketItems}
            subtotal={subtotal}
            discount={currentDiscount}
            total={total}
            paidNow={paidNow}
            leftToPay={leftToPay}
            placeholder={f.invoicePending}
            animatePaid={false}
          />
        </aside>
      </form>
    </section>
  );
}
