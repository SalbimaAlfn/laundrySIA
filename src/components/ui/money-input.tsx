"use client";

import { cn } from "@/lib/cn";
import { formatNumberID, parseRupiahOrNull } from "@/lib/money";
import styles from "./money-input.module.css";

export type MoneyInputProps = {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function MoneyInput({
  id,
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: MoneyInputProps) {
  return (
    <div className={cn(styles.wrap, invalid && styles.invalid, className)}>
      <span className={styles.prefix} aria-hidden="true">
        Rp
      </span>
      <input
        id={id}
        className={styles.input}
        inputMode="numeric"
        autoComplete="off"
        value={value === null ? "" : formatNumberID(value)}
        onChange={(event) => onChange(parseRupiahOrNull(event.target.value))}
        disabled={disabled}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
      />
    </div>
  );
}
