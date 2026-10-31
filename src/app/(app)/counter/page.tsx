import { CounterBoard } from "@/components/orders/counter-board";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/server/auth";
import { getCounterOrders } from "@/server/orders/queries";
import styles from "./counter.module.css";

type CounterPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function CounterPage({ searchParams }: CounterPageProps) {
  await requireUser();
  const [params, orders] = await Promise.all([searchParams, getCounterOrders()]);
  const t = getDictionary();

  return (
    <>
      {params.notice === "manager-only" ? (
        <p className={styles.notice} role="alert">
          {t.auth.managerOnly}
        </p>
      ) : null}
      <CounterBoard orders={orders} />
    </>
  );
}
