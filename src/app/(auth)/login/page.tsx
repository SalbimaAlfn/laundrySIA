import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getSession, homeForRole } from "@/server/auth";
import { db } from "@/server/db";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

const t = getDictionary();

export const metadata = {
  title: t.auth.title,
};

type LoginPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  const params = await searchParams;
  const notice =
    params.notice === "loggedOut"
      ? t.auth.loggedOut
      : params.notice === "inactive"
        ? t.auth.sessionEnded
        : undefined;

  const shopName = await db.setting
    .findUnique({ where: { key: "shop.name" }, select: { value: true } })
    .then((setting) => setting?.value || t.common.appName)
    .catch(() => t.common.appName);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <p className={styles.eyebrow}>{t.common.appName}</p>
        <h1 id="login-title">{shopName}</h1>
        <p className={styles.lead}>{t.auth.lead}</p>
        <LoginForm notice={notice} />
      </section>
    </main>
  );
}
