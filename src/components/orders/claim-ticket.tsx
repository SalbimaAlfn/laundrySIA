import { formatDate } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import styles from "./claim-ticket.module.css";

export type ClaimTicketItem = {
  name: string;
  unit: "KG" | "PIECE";
  quantity: string;
  total: number;
};

export type PrintSize = "thermal" | "a5";

export function ClaimTicket({
  shopName,
  shopAddress,
  invoiceNo,
  date,
  customerName,
  items,
  subtotal,
  discount,
  total,
  paidNow,
  leftToPay,
  placeholder,
  voided = false,
  printSize = "thermal",
  animatePaid = false,
}: {
  shopName: string;
  shopAddress: string | null;
  invoiceNo: string | null;
  date: string;
  customerName: string;
  items: ClaimTicketItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidNow: number;
  leftToPay: number;
  placeholder: string;
  voided?: boolean;
  printSize?: PrintSize;
  animatePaid?: boolean;
}) {
  const t = getDictionary();
  const showPaid = !voided && total > 0 && leftToPay === 0;

  return (
    <article
      className={cn(styles.ticket, styles[printSize], voided && styles.voided)}
      aria-label={t.orderForm.ticket}
    >
      <div className={styles.ticketShop}>{shopName}</div>
      {shopAddress ? <p className={styles.ticketAddress}>{shopAddress}</p> : null}
      <p className={styles.invoice}>{invoiceNo ?? placeholder}</p>
      <p className={styles.ticketDate}>{formatDate(date)}</p>
      <div className={styles.perforation} aria-hidden="true" />
      <p className={styles.ticketCustomer}>{customerName}</p>
      <div className={styles.ticketItems}>
        {items.length ? (
          items.map((item, index) => (
            <div className={styles.ticketItem} key={`${item.name}-${index}`}>
              <span>
                {item.name}
                <small>{item.quantity} {item.unit === "KG" ? t.orderForm.kg : t.orderForm.piece}</small>
              </span>
              <strong>{formatRupiah(item.total)}</strong>
            </div>
          ))
        ) : (
          <p className={styles.ticketEmpty}>{t.orderForm.chooseService}</p>
        )}
      </div>
      <div className={styles.perforation} aria-hidden="true" />
      <dl className={styles.ticketTotals}>
        <div>
          <dt>{t.orderForm.subtotal}</dt>
          <dd>{formatRupiah(subtotal)}</dd>
        </div>
        {discount > 0 ? (
          <div>
            <dt>{t.orderForm.discount}</dt>
            <dd>−{formatRupiah(discount)}</dd>
          </div>
        ) : null}
        <div className={styles.ticketTotal}>
          <dt>{t.orderForm.total}</dt>
          <dd>{formatRupiah(total)}</dd>
        </div>
        <div>
          <dt>{t.orderForm.paidNow}</dt>
          <dd>{formatRupiah(paidNow)}</dd>
        </div>
        <div className={styles.balanceRow}>
          <dt>{t.orderForm.leftToPay}</dt>
          <dd>{formatRupiah(leftToPay)}</dd>
        </div>
      </dl>
      {showPaid ? (
        <span className={cn(styles.stamp, styles.paidStamp, animatePaid && styles.animatePaid)}>
          {t.orderForm.paidStamp}
        </span>
      ) : null}
      {voided ? <span className={cn(styles.stamp, styles.voidStamp)}>{t.orders.statusVoid}</span> : null}
    </article>
  );
}
