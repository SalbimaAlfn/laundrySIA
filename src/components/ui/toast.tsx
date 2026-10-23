"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./toast.module.css";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current + 1;
      nextId.current = id;
      setToasts((current) => [...current, { id, message, variant }]);

      // Successes disappear on their own. Errors stay until dismissed.
      if (variant !== "error") {
        const timer = setTimeout(() => {
          dismiss(id);
          timers.current.delete(timer);
        }, 5000);
        timers.current.add(timer);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport}>
        {toasts.map((toast) => {
          const Icon =
            toast.variant === "success"
              ? CircleCheck
              : toast.variant === "error"
                ? CircleAlert
                : Info;

          return (
            <div
              key={toast.id}
              className={cn(styles.toast, styles[toast.variant])}
              role={toast.variant === "error" ? "alert" : "status"}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.75} className={styles.icon} />
              <p className={styles.message}>{toast.message}</p>
              <button
                type="button"
                className={styles.dismiss}
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }
  return value;
}
