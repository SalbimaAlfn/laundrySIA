import { PagePlaceholder } from "@/components/app-shell/page-placeholder";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/server/auth";
import styles from "./counter.module.css";

type CounterPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function CounterPage({ searchParams }: CounterPageProps) {
  await requireUser();
  const params = await searchParams;
  const t = getDictionary();

  return (
    <>
      {params.notice === "manager-only" ? (
        <p className={styles.notice} role="alert">
          {t.auth.managerOnly}
        </p>
      ) : null}
      <PagePlaceholder />
    </>
  );
}
