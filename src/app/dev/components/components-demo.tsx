"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { StatusBadge, type OrderStatus } from "@/components/ui/status-badge";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/money";
import styles from "./components-demo.module.css";

type DemoOrder = {
  invoice: string;
  customer: string;
  total: number;
  status: OrderStatus;
};

const demoOrders: DemoOrder[] = [
  { invoice: "INV-20261023-001", customer: "Pak Budi", total: 40000, status: "RECEIVED" },
  { invoice: "INV-20261023-002", customer: "Ibu Rina", total: 36000, status: "WASHING" },
  { invoice: "INV-20261023-003", customer: "Melati kos", total: 70000, status: "READY" },
];

const columns: Array<Column<DemoOrder>> = [
  { key: "invoice", header: "Invoice", render: (row) => row.invoice },
  { key: "customer", header: "Pelanggan", render: (row) => row.customer },
  { key: "total", header: "Total", align: "right", render: (row) => formatRupiah(row.total) },
  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

const statuses: OrderStatus[] = [
  "RECEIVED",
  "WASHING",
  "DRYING_IRONING",
  "READY",
  "COMPLETED",
  "VOID",
];

export function ComponentsDemo() {
  return (
    <ToastProvider>
      <DemoContent />
    </ToastProvider>
  );
}

function DemoContent() {
  const toast = useToast();
  const [amount, setAmount] = useState<number | null>(40000);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.note}>
          Halaman pemeriksaan komponen, hanya tersedia saat pengembangan.
        </p>
        <h1>Komponen desain</h1>
        <p className={styles.lead}>
          Setiap komponen ditampilkan dalam keadaan normal, fokus, nonaktif, dan galat.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="buttons-title">
        <h2 id="buttons-title">Tombol</h2>
        <div className={styles.row}>
          <Button>Tambah pelanggan</Button>
          <Button variant="secondary">Cetak</Button>
          <Button variant="text">Batalkan</Button>
          <Button variant="danger">Hapus</Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">Simpan</Button>
          <Button size="sm" variant="secondary">
            Kembali
          </Button>
          <Button disabled>Simpan</Button>
          <Button loading>Menyimpan</Button>
        </div>
        <p className={styles.hint}>Tombol nonaktif disertai kalimat yang menjelaskan alasannya.</p>
      </section>

      <section className={styles.section} aria-labelledby="fields-title">
        <h2 id="fields-title">Kolom isian</h2>
        <div className={styles.grid}>
          <Field htmlFor="demo-name" label="Nama pelanggan" hint="2 sampai 80 karakter.">
            <Input id="demo-name" placeholder="Pak Budi" />
          </Field>

          <Field
            htmlFor="demo-weight"
            label="Berat"
            error="Berat wajib diisi. Masukkan berat dalam kg."
          >
            <Input id="demo-weight" inputMode="decimal" placeholder="5,0" />
          </Field>

          <Field htmlFor="demo-method" label="Metode pembayaran">
            <Select id="demo-method" defaultValue="CASH">
              <option value="CASH">Tunai</option>
              <option value="TRANSFER">Transfer bank</option>
              <option value="EWALLET">E-wallet</option>
            </Select>
          </Field>

          <Field htmlFor="demo-pickup" label="Tanggal pengambilan">
            <Input id="demo-pickup" type="date" defaultValue="2026-10-25" />
          </Field>

          <Field htmlFor="demo-note" label="Catatan" hint="Opsional, maksimal 200 karakter.">
            <Textarea id="demo-note" placeholder="Pisahkan pakaian putih." />
          </Field>

          <Field
            htmlFor="demo-amount"
            label="Jumlah dibayar"
            hint="Ketik angka; titik ribuan ditambahkan otomatis."
          >
            <MoneyInput id="demo-amount" value={amount} onChange={setAmount} />
          </Field>
        </div>
        <p className={styles.readout}>
          Nilai tersimpan: {amount === null ? "kosong" : formatRupiah(amount)}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="status-title">
        <h2 id="status-title">Status pesanan</h2>
        <div className={styles.row}>
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="table-title">
        <h2 id="table-title">Tabel</h2>
        <DataTable
          columns={columns}
          rows={demoOrders}
          getRowKey={(row) => row.invoice}
          caption="Contoh pesanan"
        />
      </section>

      <section className={styles.section} aria-labelledby="overlays-title">
        <h2 id="overlays-title">Dialog dan notifikasi</h2>
        <div className={styles.row}>
          <Button onClick={() => setDialogOpen(true)}>Buka dialog</Button>
          <Button
            variant="secondary"
            onClick={() => toast.show("Pesanan tersimpan. Invoice INV-20261023-001.", "success")}
          >
            Toast sukses
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.show("Koneksi terputus. Periksa jaringan lalu coba lagi.", "error")
            }
          >
            Toast galat
          </Button>
        </div>

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Batalkan pesanan?"
          closeLabel="Tutup dialog"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Kembali
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDialogOpen(false);
                  toast.show("Pesanan dibatalkan. Tanda batal tetap tersimpan.", "success");
                }}
              >
                Batalkan pesanan
              </Button>
            </>
          }
        >
          <p className={styles.dialogText}>
            Pesanan tetap tersimpan dan ditandai batal. Tidak ada data yang dihapus.
          </p>
          <div className={styles.dialogField}>
            <Field htmlFor="demo-void-reason" label="Alasan" hint="5 sampai 200 karakter.">
              <Textarea id="demo-void-reason" placeholder="Pelanggan salah menyerahkan pakaian." />
            </Field>
          </div>
        </Dialog>
      </section>
    </main>
  );
}
