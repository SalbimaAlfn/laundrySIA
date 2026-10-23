import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Sistem Informasi Akuntansi</p>
        <h1>LaundrySIA</h1>
        <p className={styles.lead}>
          Pencatatan pesanan dan pembayaran laundry, dengan pembukuan yang tersusun otomatis.
        </p>
        <p className={styles.note}>
          Fondasi proyek sudah siap. Berikutnya: skema basis data dan autentikasi.
        </p>
        <Link className={styles.link} href="/dev/components">
          Lihat komponen desain
        </Link>
      </div>
    </main>
  );
}
