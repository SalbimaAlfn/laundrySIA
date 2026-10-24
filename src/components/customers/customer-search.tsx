"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CircleAlert, Plus, Search } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n";
import { createCustomerAction, type CustomerFormState } from "@/server/actions/customers";
import styles from "./customer-search.module.css";

export type CustomerOption = {
  id: number;
  name: string;
  phone: string;
};

type CustomerSearchProps = {
  id?: string;
  label?: string;
  hint?: string;
  onSelect: (customer: CustomerOption | null) => void;
  autoFocus?: boolean;
  disabled?: boolean;
};

const emptyState: CustomerFormState = { status: "idle" };

function QuickAddCustomerForm({
  onCreated,
  onCancel,
}: {
  onCreated: (customer: CustomerOption) => void;
  onCancel: () => void;
}) {
  const t = getDictionary();
  const { show } = useToast();
  const [state, formAction, pending] = useActionState(createCustomerAction, emptyState);
  const handled = useRef<number | null>(null);

  useEffect(() => {
    if (state.status === "success" && state.customer && handled.current !== state.customer.id) {
      handled.current = state.customer.id;
      show(t.customers.savedCreate);
      onCreated(state.customer);
    }
  }, [state, show, onCreated, t]);

  return (
    <form action={formAction} className={styles.addForm}>
      {state.status === "duplicate" ? (
        <p className={styles.formError} role="alert">
          <CircleAlert aria-hidden="true" size={16} />
          {t.customers.duplicatePhone}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className={styles.formError} role="alert">
          <CircleAlert aria-hidden="true" size={16} />
          {t.common.genericError}
        </p>
      ) : null}

      <Field htmlFor="quick-customer-name" label={t.customers.name} error={state.errors?.name}>
        <Input name="name" autoComplete="name" required autoFocus />
      </Field>

      <Field
        htmlFor="quick-customer-phone"
        label={t.customers.phone}
        hint={t.customers.phoneHint}
        error={state.errors?.phone}
      >
        <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
      </Field>

      <Field
        htmlFor="quick-customer-address"
        label={t.customers.address}
        hint={t.customers.addressHint}
        error={state.errors?.address}
      >
        <Input name="address" autoComplete="street-address" />
      </Field>

      <div className={styles.formActions}>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          {t.common.cancel}
        </Button>
        <Button type="submit" loading={pending}>
          {t.customers.save}
        </Button>
      </div>
    </form>
  );
}

export function CustomerSearch({
  id,
  label,
  hint,
  onSelect,
  autoFocus = false,
  disabled = false,
}: CustomerSearchProps) {
  const t = getDictionary();
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-customer`;
  const listboxId = `${inputId}-results`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [addOpen, setAddOpen] = useState(false);
  const [addKey, setAddKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<CustomerOption | null>(null);

  // Debounced search: only the last keystroke inside 250ms runs a request.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setActiveIndex(-1);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/customers/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { customers?: CustomerOption[] };
        setResults(data.customers ?? []);
        setActiveIndex(-1);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close the list when the cashier clicks somewhere else.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(customer: CustomerOption) {
    selectedRef.current = customer;
    setQuery(`${customer.name} · ${customer.phone}`);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(customer);
  }

  function handleChange(value: string) {
    if (selectedRef.current) {
      selectedRef.current = null;
      onSelect(null);
    }
    setQuery(value);
    if (value.trim().length > 0) setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      if (results.length > 0) {
        setActiveIndex((current) => (current + 1) % results.length);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length > 0) {
        setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      }
      return;
    }
    if (event.key === "Enter") {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        choose(results[activeIndex]);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showEmpty = open && !loading && query.trim().length > 0 && results.length === 0;

  return (
    <div className={styles.wrap} ref={containerRef}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label ?? t.customers.searchLabel}
        </label>
        {hint ? (
          <span id={`${inputId}-hint`} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>
      <div className={styles.inputRow}>
        <Search className={styles.searchIcon} aria-hidden="true" size={18} />
        <Input
          id={inputId}
          name="customerSearch"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          placeholder={t.customers.searchPlaceholder}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          className={styles.input}
        />
      </div>

      {loading ? (
        <p className={styles.status} role="status">
          {t.customers.searching}
        </p>
      ) : null}

      {open ? (
        <div className={styles.popover}>
          {results.length > 0 ? (
            <ul id={listboxId} role="listbox" className={styles.list} aria-label={t.customers.searchLabel}>
              {results.map((customer, index) => (
                <li
                  key={customer.id}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(styles.option, index === activeIndex && styles.optionActive)}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(customer)}
                >
                  <span className={styles.optionName}>{customer.name}</span>
                  <span className={styles.optionPhone}>{customer.phone}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {showEmpty ? <p className={styles.status}>{t.customers.noResults}</p> : null}

          <button
            type="button"
            className={styles.addButton}
            onClick={() => {
              setAddOpen(true);
              setAddKey((key) => key + 1);
              setOpen(false);
            }}
          >
            <Plus aria-hidden="true" size={16} />
            {t.customers.quickAdd}
          </button>
        </div>
      ) : null}

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t.customers.quickAddTitle}
        closeLabel={t.common.closeDialog}
      >
        <p className={styles.dialogHint}>{t.customers.quickAddHint}</p>
        <QuickAddCustomerForm
          key={addKey}
          onCreated={(customer) => {
            setAddOpen(false);
            choose(customer);
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Dialog>
    </div>
  );
}
