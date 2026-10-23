"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ChartColumn,
  ChevronRight,
  ClipboardList,
  Ellipsis,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  ReceiptText,
  ScrollText,
  Search,
  Settings,
  Users,
  Wallet,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n";
import { logoutAction } from "@/server/actions/auth";
import type { SessionRole } from "@/server/session";
import styles from "./app-shell.module.css";

type AppShellProps = {
  session: {
    name: string;
    role: SessionRole;
  };
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  managerOnly?: boolean;
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

export function AppShell({ session, children }: AppShellProps) {
  const t = getDictionary();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const allItems: NavItem[] = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, managerOnly: true },
    { href: "/counter", label: t.nav.counter, icon: ClipboardList },
    { href: "/orders", label: t.nav.orders, icon: ReceiptText },
    { href: "/customers", label: t.nav.customers, icon: Users },
    { href: "/receivables", label: t.nav.receivables, icon: HandCoins, managerOnly: true },
    { href: "/reports", label: t.nav.reports, icon: ChartColumn, managerOnly: true },
    { href: "/expenses", label: t.nav.expenses, icon: Wallet, managerOnly: true },
    { href: "/stock", label: t.nav.stock, icon: Package, managerOnly: true },
    { href: "/settings", label: t.nav.settings, icon: Settings, managerOnly: true },
    { href: "/audit", label: t.nav.audit, icon: ScrollText, managerOnly: true },
  ];

  const items = allItems.filter((item) => !item.managerOnly || session.role === "MANAGER");
  const isNewOrder = pathname === "/orders/new";
  const current = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(pathname, item.href));
  const pageTitle = isNewOrder ? t.nav.newOrder : (current?.label ?? t.common.appName);
  const homeHref = session.role === "MANAGER" ? "/dashboard" : "/counter";

  const mobilePrimaryHrefs = ["/counter", "/orders", "/customers"];
  const mobilePrimary = mobilePrimaryHrefs
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is NavItem => item !== undefined);
  const mobileMore = items.filter((item) => !mobilePrimaryHrefs.includes(item.href));
  const moreActive = moreOpen || mobileMore.some((item) => isActive(pathname, item.href));

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        {t.common.skipToContent}
      </a>

      <aside className={styles.sidebar}>
        <Link className={styles.brand} href={homeHref}>
          <WashingMachine aria-hidden="true" size={26} />
          <span className={styles.brandText}>{t.common.appName}</span>
        </Link>

        <nav className={styles.nav} aria-label={t.nav.primary}>
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              isActive(pathname, item.href) && !(isNewOrder && item.href === "/orders");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(styles.navLink, active && styles.navLinkActive)}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.4 : 1.8} />
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.account}>
          <div className={styles.accountInfo}>
            <span className={styles.accountName}>{session.name}</span>
            <span className={styles.accountRole}>{t.roles[session.role]}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className={styles.logout} title={t.common.logOut}>
              <LogOut aria-hidden="true" size={18} />
              <span className={styles.logoutLabel}>{t.common.logOut}</span>
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>

          <form className={styles.search} action="/orders" role="search">
            <Search className={styles.searchIcon} aria-hidden="true" size={18} />
            <label className="sr-only" htmlFor="global-search">
              {t.nav.searchLabel}
            </label>
            <input
              id="global-search"
              name="q"
              type="search"
              placeholder={t.nav.searchPlaceholder}
              autoComplete="off"
            />
          </form>

          <div className={styles.mobileUser}>
            <span className="sr-only">{session.name}</span>
            <span className={styles.avatar} aria-hidden="true">
              {initialsOf(session.name)}
            </span>
          </div>
        </header>

        <main id="main-content" className={styles.content}>
          {children}
        </main>
      </div>

      <nav className={styles.bottomNav} aria-label={t.nav.primary}>
        {mobilePrimary.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href) && !(isNewOrder && item.href === "/orders");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.bottomLink, active && styles.bottomLinkActive)}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.bottomIcon}>
                <Icon aria-hidden="true" size={21} strokeWidth={active ? 2.3 : 1.8} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/orders/new"
          className={cn(styles.newOrder, isNewOrder && styles.newOrderActive)}
          aria-current={isNewOrder ? "page" : undefined}
        >
          <span className={styles.newOrderIcon}>
            <Plus aria-hidden="true" size={26} strokeWidth={2.4} />
          </span>
          <span>{t.nav.newOrder}</span>
        </Link>

        {mobilePrimary.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href) && !(isNewOrder && item.href === "/orders");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.bottomLink, active && styles.bottomLinkActive)}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.bottomIcon}>
                <Icon aria-hidden="true" size={21} strokeWidth={active ? 2.3 : 1.8} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={cn(styles.bottomLink, moreActive && styles.bottomLinkActive)}
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className={styles.bottomIcon}>
            <Ellipsis aria-hidden="true" size={21} />
          </span>
          <span>{t.nav.more}</span>
        </button>
      </nav>

      <Dialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={t.nav.menu}
        closeLabel={t.common.closeDialog}
      >
        <div className={styles.moreList}>
          <div className={styles.moreAccount}>
            <span className={styles.avatar} aria-hidden="true">
              {initialsOf(session.name)}
            </span>
            <span>
              <span className={styles.moreName}>{session.name}</span>
              <span className={styles.moreRole}>{t.roles[session.role]}</span>
            </span>
          </div>

          {mobileMore.map((item) => {
            const Icon = item.icon;
            const active =
              isActive(pathname, item.href) && !(isNewOrder && item.href === "/orders");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.moreLink, active && styles.moreLinkActive)}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
              >
                <Icon aria-hidden="true" size={20} />
                <span>{item.label}</span>
                <ChevronRight className={styles.moreChevron} aria-hidden="true" size={18} />
              </Link>
            );
          })}

          <div className={styles.moreDivider} />

          <form action={logoutAction}>
            <button type="submit" className={styles.moreLogout}>
              <LogOut aria-hidden="true" size={20} />
              <span>{t.common.logOut}</span>
            </button>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
