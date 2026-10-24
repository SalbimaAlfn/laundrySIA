import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Tags } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { requireRole } from "@/server/auth";
import styles from "./settings.module.css";

export const metadata: Metadata = {
  title: getDictionary().nav.settings,
};

export default async function SettingsPage() {
  await requireRole("MANAGER");
  const t = getDictionary();

  return (
    <section className={styles.page}>
      <Link className={styles.card} href="/settings/services">
        <span className={styles.icon} aria-hidden="true">
          <Tags size={22} />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>{t.services.title}</span>
          <span className={styles.lead}>{t.services.lead}</span>
        </span>
        <ChevronRight className={styles.chevron} aria-hidden="true" size={20} />
      </Link>
    </section>
  );
}
