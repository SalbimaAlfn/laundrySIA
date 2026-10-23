import { Sparkles } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import styles from "./page-placeholder.module.css";

export function PagePlaceholder() {
  const t = getDictionary();

  return (
    <section className={styles.placeholder}>
      <span className={styles.icon} aria-hidden="true">
        <Sparkles size={22} />
      </span>
      <h2>{t.common.comingSoon}</h2>
      <p>{t.common.comingSoonBody}</p>
    </section>
  );
}
