import {
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./field.module.css";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  invalid?: boolean;
};

export type FieldProps = {
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  /** Optional control rendered beside the input, such as a show-password toggle. */
  action?: ReactNode;
  className?: string;
};

/**
 * Label, control, helper text, and error in one block. The child control gets
 * the id and ARIA wiring automatically, so errors are always announced.
 */
export function Field({ htmlFor, label, hint, error, children, action, className }: FieldProps) {
  const describedBy = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined;

  const control = isValidElement<ControlProps>(children)
    ? cloneElement(children as ReactElement<ControlProps>, {
        id: htmlFor,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        invalid: error ? true : undefined,
      })
    : children;

  return (
    <div className={cn(styles.field, className)}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {action ? (
        <div className={styles.controlRow}>
          {control}
          {action}
        </div>
      ) : (
        control
      )}
      {error ? (
        <p id={`${htmlFor}-error`} className={styles.error}>
          <CircleAlert aria-hidden="true" size={14} />
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ className, invalid = false, ...rest }: InputProps) {
  return (
    <input
      className={cn(styles.control, invalid && styles.invalid, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ className, invalid = false, children, ...rest }: SelectProps) {
  return (
    <select
      className={cn(styles.control, invalid && styles.invalid, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ className, invalid = false, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(styles.control, styles.textarea, invalid && styles.invalid, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
