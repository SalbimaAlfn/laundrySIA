"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n";
import { formatRupiah } from "@/lib/money";
import {
  createServiceAction,
  toggleServiceActiveAction,
  updateServiceAction,
  type ServiceFormState,
  type ServiceRecord,
} from "@/server/actions/services";
import styles from "./services-manager.module.css";

const emptyState: ServiceFormState = { status: "idle" };

function ServiceForm({
  mode,
  service,
  onDone,
  onCancel,
}: {
  mode: "add" | "edit";
  service?: ServiceRecord;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = getDictionary();
  const { show } = useToast();
  const action = mode === "add" ? createServiceAction : updateServiceAction;
  const [state, formAction, pending] = useActionState(action, emptyState);
  const [price, setPrice] = useState<number | null>(service?.price ?? null);
  const handled = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !handled.current) {
      handled.current = true;
      if (mode === "add") {
        show(t.services.savedCreate);
      } else if (state.priceChanged) {
        show(t.services.priceChanged);
      } else {
        show(t.services.savedUpdate);
      }
      onDone();
    }
  }, [state, mode, show, onDone, t]);

  return (
    <form action={formAction} className={styles.form}>
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      {state.status === "duplicate" ? (
        <p className={styles.formError} role="alert">
          {t.services.duplicate}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className={styles.formError} role="alert">
          {t.common.genericError}
        </p>
      ) : null}

      <Field
        htmlFor={`service-name-${mode}`}
        label={t.services.name}
        hint={t.services.nameHint}
        error={state.errors?.name}
      >
        <Input name="name" defaultValue={service?.name} required autoFocus />
      </Field>

      <Field htmlFor={`service-unit-${mode}`} label={t.services.unit} error={state.errors?.unit}>
        <Select name="unit" defaultValue={service?.unit ?? "KG"} required>
          <option value="KG">{t.services.unitKg}</option>
          <option value="PIECE">{t.services.unitPiece}</option>
        </Select>
      </Field>

      <Field
        htmlFor={`service-price-${mode}`}
        label={t.services.price}
        hint={t.services.priceHint}
        error={state.errors?.price}
      >
        <MoneyInput id={`service-price-${mode}`} value={price} onChange={setPrice} />
      </Field>
      <input type="hidden" name="price" value={price ?? ""} />

      <Field
        htmlFor={`service-turnaround-${mode}`}
        label={`${t.services.turnaround} (${t.services.turnaroundUnit})`}
        hint={t.services.turnaroundHint}
        error={state.errors?.turnaroundDays}
      >
        <Input
          name="turnaroundDays"
          type="number"
          inputMode="numeric"
          min={0}
          max={30}
          step={1}
          defaultValue={service?.turnaroundDays ?? 1}
          required
        />
      </Field>

      <label className={styles.checkbox}>
        <input type="checkbox" name="isActive" defaultChecked={service?.isActive ?? true} />
        <span>{t.services.isActive}</span>
      </label>

      <div className={styles.formActions}>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          {t.services.cancel}
        </Button>
        <Button type="submit" loading={pending}>
          {t.services.save}
        </Button>
      </div>
    </form>
  );
}

export function ServicesManager({ services }: { services: ServiceRecord[] }) {
  const t = getDictionary();
  const { show } = useToast();
  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; service?: ServiceRecord } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function toggleActive(service: ServiceRecord) {
    const formData = new FormData();
    formData.set("id", String(service.id));
    formData.set("isActive", String(!service.isActive));

    startTransition(async () => {
      if (!(await toggleServiceActiveAction(formData))) return;
      show(service.isActive ? t.services.deactivated : t.services.activated);
    });
  }

  const columns: Array<Column<ServiceRecord>> = [
    {
      key: "name",
      header: t.services.name,
      render: (service) => <span className={styles.name}>{service.name}</span>,
    },
    {
      key: "unit",
      header: t.services.unit,
      render: (service) =>
        service.unit === "KG" ? t.services.unitKg : t.services.unitPiece,
    },
    {
      key: "price",
      header: t.services.price,
      align: "right",
      render: (service) => <span className="money">{formatRupiah(service.price)}</span>,
    },
    {
      key: "turnaround",
      header: t.services.turnaround,
      align: "right",
      render: (service) => (
        <span className={styles.turnaround}>
          {service.turnaroundDays} {t.services.turnaroundUnit}
        </span>
      ),
    },
    {
      key: "status",
      header: t.services.status,
      render: (service) => (
        <span className={cn(styles.badge, service.isActive ? styles.active : styles.inactive)}>
          {service.isActive ? t.services.active : t.services.inactive}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (service) => (
        <div className={styles.rowActions}>
          <Button
            variant="text"
            size="sm"
            onClick={() => setDialog({ mode: "edit", service })}
          >
            <Pencil aria-hidden="true" size={16} />
            {t.services.edit}
          </Button>
          <Button
            variant="text"
            size="sm"
            onClick={() => toggleActive(service)}
            disabled={isPending}
          >
            {service.isActive ? t.services.deactivate : t.services.activate}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <p className={styles.lead}>{t.services.lead}</p>
        <Button onClick={() => setDialog({ mode: "add" })}>
          <Plus aria-hidden="true" size={18} />
          {t.services.add}
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={services}
        getRowKey={(service) => String(service.id)}
        caption={t.services.listCaption}
        empty={t.services.empty}
      />

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? t.services.editTitle : t.services.addTitle}
        closeLabel={t.common.closeDialog}
      >
        {dialog ? (
          <ServiceForm
            mode={dialog.mode}
            service={dialog.service}
            onDone={() => setDialog(null)}
            onCancel={() => setDialog(null)}
          />
        ) : null}
      </Dialog>
    </section>
  );
}
