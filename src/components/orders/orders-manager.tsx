"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import type { OrderSummary } from "@/server/orders/queries";
import styles from "./orders-manager.module.css";

type OrdersManagerProps = {
  orders: OrderSummary[];
  total: number;
  totalPages: number;
  currentPage: number;
  filters: {
    status: string;
    date: string;
    customer: string;
    invoice: string;
    paymentState: string;
  };
};

export function OrdersManager({
  orders,
  total,
  totalPages,
  currentPage,
  filters,
}: OrdersManagerProps) {
  const t = getDictionary();
  const router = useRouter();

  const [status, setStatus] = useState(filters.status);
  const [date, setDate] = useState(filters.date);
  const [customer, setCustomer] = useState(filters.customer);
  const [invoice, setInvoice] = useState(filters.invoice);
  const [paymentState, setPaymentState] = useState(filters.paymentState);

  function updateFilters() {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (date) params.set("date", date);
    if (customer) params.set("customer", customer);
    if (invoice) params.set("invoice", invoice);
    if (paymentState && paymentState !== "all") params.set("paymentState", paymentState);
    params.set("page", "1");
    router.push(`/orders?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/orders");
  }

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (date) params.set("date", date);
    if (customer) params.set("customer", customer);
    if (invoice) params.set("invoice", invoice);
    if (paymentState && paymentState !== "all") params.set("paymentState", paymentState);
    params.set("page", String(page));
    return `/orders?${params.toString()}`;
  }

  const hasFilters =
    status !== "all" || date || customer || invoice || paymentState !== "all";

  const statusColors: Record<string, string> = {
    RECEIVED: styles.statusReceived ?? "",
    WASHING: styles.statusWashing ?? "",
    DRYING_IRONING: styles.statusDrying ?? "",
    READY: styles.statusReady ?? "",
    COMPLETED: styles.statusCompleted ?? "",
    VOID: styles.statusVoid ?? "",
  };

  const statusLabels: Record<string, string> = {
    RECEIVED: t.orders.statusReceived,
    WASHING: t.orders.statusWashing,
    DRYING_IRONING: t.orders.statusDrying,
    READY: t.orders.statusReady,
    COMPLETED: t.orders.statusCompleted,
    VOID: t.orders.statusVoid,
  };

  const columns: Array<Column<OrderSummary>> = [
    {
      key: "invoiceNo",
      header: t.orders.invoice,
      render: (order) => (
        <Link href={`/orders/${order.id}`} className={styles.invoiceLink}>
          {order.invoiceNo}
        </Link>
      ),
    },
    {
      key: "createdAt",
      header: t.orders.date,
      render: (order) => new Date(order.createdAt).toLocaleDateString("id-ID"),
    },
    {
      key: "customerName",
      header: t.orders.customer,
      render: (order) => <span className={styles.customer}>{order.customerName}</span>,
    },
    {
      key: "total",
      header: t.orders.total,
      align: "right",
      render: (order) => <span className="money">{formatRupiah(order.total)}</span>,
    },
    {
      key: "paid",
      header: t.orders.paid,
      align: "right",
      render: (order) => <span className="money">{formatRupiah(order.paid)}</span>,
    },
    {
      key: "balance",
      header: t.orders.balance,
      align: "right",
      render: (order) => {
        const balance = order.balance;
        if (balance === 0) return <span className={styles.paid}>-</span>;
        return <span className={styles.balance}>{formatRupiah(balance)}</span>;
      },
    },
    {
      key: "status",
      header: t.orders.status,
      render: (order) => (
        <span className={cn(styles.badge, statusColors[order.status])}>
          {statusLabels[order.status] ?? order.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (order) => (
        <div className={styles.rowActions}>
          <Link href={`/orders/${order.id}`} className={styles.viewLink}>
            {t.orders.view}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <p className={styles.lead}>
          {t.orders.lead} <strong>{total}</strong> {t.orders.orders}
        </p>
        <Link href="/orders/new" className={styles.newButton}>
          <Button>
            {t.orders.newOrder}
          </Button>
        </Link>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <Select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label={t.orders.status}
            className={styles.filterSelect}
          >
            <option value="all">{t.orders.allStatus}</option>
            <option value="RECEIVED">{t.orders.statusReceived}</option>
            <option value="WASHING">{t.orders.statusWashing}</option>
            <option value="DRYING_IRONING">{t.orders.statusDrying}</option>
            <option value="READY">{t.orders.statusReady}</option>
            <option value="COMPLETED">{t.orders.statusCompleted}</option>
          </Select>

          <Input
            type="date"
            aria-label={t.orders.date}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.filterDate}
          />

          <Input
            type="search"
            aria-label={t.orders.customer}
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder={t.orders.customerPlaceholder}
            className={styles.filterInput}
          />

          <Input
            type="search"
            aria-label={t.orders.invoice}
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder={t.orders.invoicePlaceholder}
            className={styles.filterInput}
          />

          <Select
            name="paymentState"
            value={paymentState}
            onChange={(e) => setPaymentState(e.target.value)}
            aria-label={t.orders.payment}
            className={styles.filterSelect}
          >
            <option value="all">{t.orders.allPayment}</option>
            <option value="unpaid">{t.orders.unpaid}</option>
            <option value="partial">{t.orders.partial}</option>
            <option value="paid">{t.orders.paid}</option>
          </Select>

          <Button variant="secondary" onClick={updateFilters}>
            <Search aria-hidden="true" size={16} />
            {t.orders.search}
          </Button>

          {hasFilters ? (
            <Button variant="text" onClick={clearFilters}>
              <X aria-hidden="true" size={16} />
              {t.orders.clear}
            </Button>
          ) : null}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        getRowKey={(order) => String(order.id)}
        caption={t.orders.listCaption}
        empty={t.orders.empty}
      />

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            {t.orders.page} {currentPage} {t.orders.of} {totalPages}
          </span>
          <div className={styles.pageButtons}>
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)} className={styles.pageLink}>
                <ChevronLeft aria-hidden="true" size={16} />
                {t.orders.previous}
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link href={pageHref(currentPage + 1)} className={styles.pageLink}>
                {t.orders.next}
                <ChevronRight aria-hidden="true" size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
