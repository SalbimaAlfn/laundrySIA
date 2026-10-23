import {
  Ban,
  CircleCheck,
  Droplets,
  Flame,
  Inbox,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./status-badge.module.css";

export type OrderStatus =
  "RECEIVED" | "WASHING" | "DRYING_IRONING" | "READY" | "COMPLETED" | "VOID";

const statusConfig: Record<
  OrderStatus,
  { label: string; Icon: LucideIcon; tone: string | undefined }
> = {
  RECEIVED: { label: "Diterima", Icon: Inbox, tone: styles.received },
  WASHING: { label: "Sedang dicuci", Icon: Droplets, tone: styles.washing },
  DRYING_IRONING: { label: "Dikeringkan / disetrika", Icon: Flame, tone: styles.drying },
  READY: { label: "Siap diambil", Icon: PackageCheck, tone: styles.ready },
  COMPLETED: { label: "Selesai", Icon: CircleCheck, tone: styles.completed },
  VOID: { label: "Dibatalkan", Icon: Ban, tone: styles.void },
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { label, Icon, tone } = statusConfig[status];

  return (
    <span className={cn(styles.badge, tone, className)}>
      <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
      {label}
    </span>
  );
}
