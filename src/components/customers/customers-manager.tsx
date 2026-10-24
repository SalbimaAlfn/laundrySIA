"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, UserRoundCheck, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n";
import {
  createCustomerAction,
  toggleCustomerActiveAction,
  updateCustomerAction,
  type CustomerFormState,
  type CustomerRecord,
} from "@/server/actions/customers";
import styles from "./customers-manager.module.css";

const emptyState: CustomerFormState = { status: "idle" };

function CustomerForm({
  mode,
  customer,
  onDone,
  onCancel,
}: {
  mode: "add" | "edit";
  customer?: CustomerRecord;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = getDictionary();
  const { show } = useToast();
  const action = mode === "add" ? createCustomerAction : updateCustomerAction;
  const [state, formAction, pending] = useActionState(action, emptyState);
  const handled = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !handled.current) {
      handled.current = true;
      show(mode === "add" ? t.customers.savedCreate : t.customers.savedUpdate);
      onDone();
    }
  }, [state, mode, show, onDone, t]);

  return (
    <form action={formAction} className={styles.form}>
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}

      {state.status === "duplicate" ? (
        <p className={styles.formError} role="alert">
          {t.customers.duplicatePhone}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className={styles.formError} role="alert">
          {t.common.genericError}
        </p>
      ) : null}

      <Field htmlFor={`customer-name-${mode}`} label={t.customers.name} error={state.errors?.name}>
        <Input
          name="name"
          autoComplete="name"
          defaultValue={customer?.name}
          required
          autoFocus
        />
      </Field>

      <Field
        htmlFor={`customer-phone-${mode}`}
        label={t.customers.phone}
        hint={t.customers.phoneHint}
        error={state.errors?.phone}
      >
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={customer?.phone}
          required
        />
      </Field>

      <Field
        htmlFor={`customer-address-${mode}`}
        label={t.customers.address}
        hint={t.customers.addressHint}
        error={state.errors?.address}
      >
        <Input
          name="address"
          autoComplete="street-address"
          defaultValue={customer?.address ?? ""}
        />
      </Field>

      <div className={styles.formActions}>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          {t.customers.cancel}
        </Button>
        <Button type="submit" loading={pending}>
          {t.customers.save}
        </Button>
      </div>
    </form>
  );
}

export function CustomersManager({
  customers,
  query,
  canManage,
}: {
  customers: CustomerRecord[];
  query: string;
  canManage: boolean;
}) {
  const t = getDictionary();
  const { show } = useToast();
  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; customer?: CustomerRecord } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function toggleActive(customer: CustomerRecord) {
    const formData = new FormData();
    formData.set("id", String(customer.id));
    formData.set("isActive", String(!customer.isActive));

    startTransition(async () => {
      await toggleCustomerActiveAction(formData);
      show(customer.isActive ? t.customers.deactivated : t.customers.activated);
    });
  }

  const columns: Array<Column<CustomerRecord>> = [
    {
      key: "name",
      header: t.customers.name,
      render: (customer) => <span className={styles.name}>{customer.name}</span>,
    },
    {
      key: "phone",
      header: t.customers.phone,
      render: (customer) => <span className={styles.phone}>{customer.phone}</span>,
    },
    {
      key: "address",
      header: t.customers.address,
      render: (customer) => customer.address ?? <span className={styles.muted}>—</span>,
      className: styles.addressCell,
    },
    {
      key: "status",
      header: t.customers.status,
      render: (customer) => (
        <span className={cn(styles.badge, customer.isActive ? styles.active : styles.inactive)}>
          {customer.isActive ? t.customers.active : t.customers.inactive}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (customer) => (
        <div className={styles.rowActions}>
          <Button
            variant="text"
            size="sm"
            onClick={() => setDialog({ mode: "edit", customer })}
          >
            <Pencil aria-hidden="true" size={16} />
            {t.customers.edit}
          </Button>
          {canManage ? (
            <Button
              variant="text"
              size="sm"
              onClick={() => toggleActive(customer)}
              disabled={isPending}
            >
              {customer.isActive ? (
                <UserRoundX aria-hidden="true" size={16} />
              ) : (
                <UserRoundCheck aria-hidden="true" size={16} />
              )}
              {customer.isActive ? t.customers.deactivate : t.customers.activate}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <p className={styles.lead}>{t.customers.lead}</p>
        <Button onClick={() => setDialog({ mode: "add" })}>
          <Plus aria-hidden="true" size={18} />
          {t.customers.add}
        </Button>
      </div>

      <form className={styles.search} action="/customers" role="search">
        <label className="sr-only" htmlFor="customer-list-search">
          {t.customers.searchLabel}
        </label>
        <div className={styles.searchRow}>
          <Search className={styles.searchIcon} aria-hidden="true" size={18} />
          <Input
            id="customer-list-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t.customers.searchPlaceholder}
            autoComplete="off"
            className={styles.searchInput}
          />
        </div>
        <Button type="submit" variant="secondary">
          {t.customers.search}
        </Button>
        {query ? (
          <Link className={styles.clear} href="/customers">
            {t.common.cancel}
          </Link>
        ) : null}
      </form>

      <DataTable
        columns={columns}
        rows={customers}
        getRowKey={(customer) => String(customer.id)}
        caption={t.customers.listCaption}
        empty={query ? t.customers.emptySearch : t.customers.empty}
      />

      {canManage ? <p className={styles.pageHint}>{t.customers.inactiveHint}</p> : null}

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? t.customers.editTitle : t.customers.addTitle}
        closeLabel={t.common.closeDialog}
      >
        {dialog ? (
          <CustomerForm
            mode={dialog.mode}
            customer={dialog.customer}
            onDone={() => setDialog(null)}
            onCancel={() => setDialog(null)}
          />
        ) : null}
      </Dialog>
    </section>
  );
}
