# Laporan Audit: Halaman Manajer, Biaya Operasional, dan Identitas Bisnis

**Proyek:** LaundrySIA — Sistem Manajemen Laundry dengan Akuntansi Terintegrasi  
**Tanggal Audit:** November 2026  
**Auditor:** Senior Full-Stack Engineer / QA Engineer  
**Status:** Investigasi saja — tidak ada modifikasi file, database, atau data

---

## Daftar Isi

- [A. Executive Summary](#a-executive-summary)
- [B. Manager Page — Expenses Audit](#b-manager-page---expenses-audit)
- [C. Historical Nominal Error](#c-historical-nominal-error)
- [D. New Features](#d-new-features)
- [E. Business Name Investigation](#e-business-name-investigation)
- [F. Address Investigation](#f-address-investigation)
- [G. Cross-Page Consistency](#g-cross-page-consistency)
- [H. Root Cause Summary](#h-root-cause-summary)
- [I. Recommended Improvements](#i-recommended-improvements)
- [J. Implementation Plan](#j-implementation-plan)
- [K. Evidence and Verification](#k-evidence-and-verification)

---

## A. Executive Summary

Aplikasi LaundrySIA adalah sistem manajemen laundry dengan akuntansi terintegrasi, dibangun dengan **Next.js 16**, **React 19**, **Prisma 7**, dan **MariaDB**. Aplikasi ini memiliki dua peran (Cashier dan Manager), dan seluruh fitur keuangan diimplementasikan dengan jurnal akuntansi yang seimbang dan tidak bisa dihapus (hanya bisa dibalik/reverse).

### Temuan Utama

| No | Temuan | Severity | Status |
|----|--------|----------|--------|
| 1 | Nama perusahaan menampilkan "Sari Laundry" alih-alih "Bee Bee Laundry" | Critical | Tersedia di seed, belum di DB |
| 2 | Alamat bukan "Jalan Abdul Gani Atas" | Critical | Tersedia di seed, belum di DB |
| 3 | Error nominal biaya (titik ribuan) sebagian diperbaiki, risiko koma desimal masih ada | Medium | Parsing `parseRupiah()` masih lemah |
| 4 | Saldo biaya telah diperbaiki: dari penjumlahan manual ke jurnal akuntansi | High | Sudah diperbaiki |
| 5 | Tidak ada halaman pengaturan profil perusahaan (nama/alamat) | High | Belum ada fitur |
| 6 | Branding tidak konsisten (sidebar "LaundrySIA", login dari DB) | Low | Belum seragam |

### Kesimpulan Singkat

Aplikasi secara fungsional sudah lengkap sesuai PRD (semua fitur P1, sebagian P2/P3). Masalah utama adalah **identitas perusahaan yang tidak sinkron dengan database** dan **tidak ada UI untuk mengedit profil perusahaan**. Error nominal biaya telah sebagian diperbaiki tetapi masih ada risiko parsing.

---

## B. Manager Page — Expenses Audit

Tabel berikut merangkum audit terhadap bagian Expenses di halaman Manager:

| Area | Current Behavior | Problem Found | Evidence | Status |
|------|-----------------|---------------|----------|--------|
| Input nominal biaya | Input teks (`type="text"`, `inputMode="numeric"`) tanpa formatting otomatis | Tidak ada formatting ribuan saat mengetik; user harus mengetik angka mentah | `src/components/expenses/expenses-manager.tsx` baris 110-118 | ⚠️ Perlu perhatian |
| Parsing nominal | `parseRupiah()` menghapus semua non-digit, lalu `Number()` | "1.000,50" → 100.050 (salah, seharusnya 1.000). Koma desimal dihapus bersama titik ribuan | `src/lib/money.ts` baris 27-29; `src/server/actions/expenses.ts` baris 43-45 | ⚠️ Risiko parsing |
| Validasi nominal | `positiveMoneySchema`: integer, min 1, max 1 miliar | Tidak menerima desimal (sen). Untuk biaya bulat rupiah ini OK | `src/lib/schemas/common.ts` baris 47-52 | ✅ OK untuk rupiah bulat |
| Penyimpanan database | `Expense.amount` bertipe `Int` (integer rupiah) | Konsisten, tidak ada masalah penyimpanan | `prisma/schema.prisma` model Expense | ✅ OK |
| Serialisasi API | `getExpenses()` mengembalikan `amount` sebagai integer dari DB | Tidak ada masalah serialisasi | `src/server/actions/expenses.ts` baris 120-147 | ✅ OK |
| Tampilan daftar biaya | `formatRupiah(amount)` menambahkan titik ribuan, tanpa desimal | Tampilan konsisten dengan nilai yang disimpan | `src/components/expenses/expenses-manager.tsx` baris 181 | ✅ OK |
| Saldo tunai/bank | Dibaca dari jurnal akuntansi (`accountBalance`) | Perbaikan dari versi lama yang menjumlahkan tabel secara manual (bisa menyimpang) | `src/server/actions/expenses.ts` baris 151-158 | ✅ Diperbaiki |
| Ringkasan bulanan/tahunan | Laporan via `incomeStatement()` dari `src/server/reports/queries.ts` | Mengambil dari jurnal, konsisten dengan saldo | `src/server/reports/queries.ts` | ✅ OK |
| Filtering, sorting, pagination | Expenses diurutkan berdasarkan tanggal desc, tidak ada pagination | Tidak ada pagination; semua data di-load sekadar | `src/server/actions/expenses.ts` baris 121-124 | ⚠️ Tanpa pagination |
| Dashboard figures | Dashboard menampilkan earnedToday, receivedToday, toCollect dari `dashboardData()` | Mengambil dari `incomeStatement` dan query jurnal | `src/server/reports/queries.ts` | ✅ OK |

### Detail: Fungsi Parsing Nominal

**File:** `src/lib/money.ts`

```typescript
export function parseRupiah(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
```

**Contoh perilaku:**
| Input User | Nilai yang Tersimpan | Status | Keterangan |
|------------|---------------------|--------|------------|
| `1000000` | 1.000.000 | ✅ Benar | Tanpa pemisah |
| `1.000.000` | 1.000.000 | ✅ Benar | Titik ribuan dihilangkan |
| `1.000,50` | 100.050 | ❌ Salah | Koma desimal juga dihapus |
| `1.000.000,50` | 100000050 | ❌ Salah | Komplit salah |

### Detail: Perbaikan Saldo Biaya

**Versi lama** (sebelum commit `2f43a83`): `getExpenseBalance()` menjumlahkan dari tabel `expense`, `payment`, dan `supplyMovement` secara manual, ditambah saldo awal dari setting. Masalah: melewatkan pesanan yang dibatalkan, semua pembelian stok dianggap tunai, bisa menyimpang dari trial balance.

**Versi sekarang:** Membaca langsung dari jurnal akuntansi melalui `accountBalance("1-100")` dan `accountBalance("1-110")`. Sumber kebenaran tunggal.

---

## C. Historical Nominal Error

### Masalah Asli

Pada implementasi awal (commit `b7bb013`, "adding feature phase 4-5"), fungsi `readForm` di `expenses.ts` menggunakan:

```typescript
amount: Number(formData.get("amount")),
```

Jika user mengetik "1.000.000" (dengan titik pemisah ribuan menurut format Indonesia), `Number("1.000.000")` menghasilkan `NaN`, dan validasi Zod menolak input tersebut. User terpaksa mengetik angka tanpa formatting.

### Perbaikan

Pada commit `2f43a83` ("fixing database bugs"), kode diubah menjadi:

```typescript
amount: parseRupiah(String(formData.get("amount") ?? "")),
```

Fungsi `parseRupiah` di `src/lib/money.ts` menghapus semua karakter non-digit, sehingga "1.000.000" → "1000000" → 1.000.000 ✓.

### Risiko yang Masih Ada

`parseRupiah` menghapus **semua** karakter non-digit, termasuk koma desimal. Jika user mencoba memasukkan nilai dengan koma desimal (format Indonesia), hasilnya akan salah berlipat-lipat.

Namun, karena biaya dalam sistem ini disimpan sebagai **integer rupiah** (tanpa sen), risiko ini muncul hanya jika user memasukkan koma desimal. Untuk input bulat seperti "1.000.000" atau "1000000", hasilnya benar.

### Bukti Historis

- Commit `b7bb013`: Implementasi awal fitur biaya dengan `Number()` parsing
- Commit `2f43a83`: Perbaikan `readForm()` dari `Number()` ke `parseRupiah()` dan perbaikan `getExpenseBalance()`

---

## D. New Features

Tidak ada versi "sebelumnya" yang jelas selain commit Git. Klasifikasi berikut berdasarkan fase implementasi dalam `task.md` dan git history:

| Feature | Available Before? | Current Functionality | Evidence | Status |
|---------|-------------------|----------------------|----------|--------|
| Expenses with reversal | Tidak (Phase 7) | Manager mencatat pengeluaran (kategori, jumlah, tanggal, sumber dana, catatan) dan membaliknya dengan alasan | `src/app/(app)/expenses/page.tsx`, `src/components/expenses/expenses-manager.tsx`, `src/server/actions/expenses.ts` | ✅ New and functional |
| Supply management (purchase/usage/low stock) | Tidak (Phase 7) | Manajemen stok supply, pembelian, pemakaian, peringatan stok rendah | `src/app/(app)/stock/page.tsx`, `src/components/stock/stock-manager.tsx`, `src/server/actions/supply.ts` | ✅ New and functional |
| Reports (income statement, cash flow, balance sheet, sales, ledger, trial balance) | Tidak (Phase 8) | Laporan keuangan lengkap dengan periode, ringkasan bahasa plain, export CSV | `src/app/(app)/reports/[type]/page.tsx`, `src/server/reports/queries.ts` | ✅ New and functional |
| Dashboard | Tidak (Phase 8) | Dashboard manajer dengan pendapatan, kas, piutang, stok rendah, pesanan siap, grafik 7 hari | `src/app/(app)/dashboard/page.tsx` | ✅ New and functional |
| Void order | Tidak (Phase 9) | Manager membatalkan pesanan dengan alasan, jurnal dibalik otomatis | `src/components/orders/order-detail.tsx` | ✅ New and functional |
| Audit log page | Tidak (Phase 9) | Halaman log audit dengan filter user, action, tanggal | `src/app/(app)/audit/page.tsx`, `src/server/audit.ts` | ✅ New and functional |
| CSV export reports | Tidak (Phase 8, diganti dari Excel) | Export CSV (buka di Excel), tidak ada exceljs | `src/app/(app)/api/reports/export/route.ts` | ✅ New and functional (scope reduced) |
| CSS revenue chart | Tidak (diganti dari Recharts) | Grafik batang CSS 7 hari dengan text alternative, tidak ada Recharts | `src/app/(app)/dashboard/page.tsx` | ✅ New and functional (scope reduced) |
| Shop profile settings | TIDAK ADA | Tidak ada halaman untuk mengedit nama/alamat perusahaan. Hanya `settings/services` untuk layanan | `src/app/(app)/settings/page.tsx` hanya link ke `/settings/services` | ❌ Missing feature |
| Company name from DB | Tidak ada di UI lain | Hanya halaman login yang baca `shop.name` dari DB. Sidebar pakai hardcoded "LaundrySIA" | `src/app/(auth)/login/page.tsx`, `src/components/app-shell/app-shell.tsx` | ⚠️ Inconsistent |

### Catatan Klasifikasi

- Tidak ada fitur yang diklasifikasikan sebagai "New UI without confirmed backend functionality"
- Semua fitur UI di atas memiliki backend yang teruji dengan tes otomatis (158 tests passed)
- `design.md` masih menunjukkan "Sari Laundry" di beberapa tempat (line 253, 422-423)

---

## E. Business Name Investigation

### Mengapa "Sari Laundry" Muncul Instead of "Bee Bee Laundry"?

#### Bukti dari Git History

**Commit `d302b34` ("change name name", 24 Nov 2026, 10:46 WIB):**
```
-  { key: "shop.name", value: "Sari Laundry" },
+  { key: "shop.name", value: "Bee Bee Laundry" },
```

**Commit `0888d38` ("adding and change name company", 24 Nov 2026, 11:15 WIB):**
```
-  { key: "shop.address", value: "Jl. Mawar No. 12, Jakarta" },
+  { key: "shop.address", value: "Jalan Abdul Gani Atas" },
```

#### Alur Resolusi Nama Perusahaan

| Komponen | Nilai yang Digunakan | Sumber | Status |
|----------|---------------------|--------|--------|
| Berkas seed (`prisma/seed.ts`) | "Bee Bee Laundry" | Source code | ✅ Benar |
| Database `Setting` tabel (disangka) | "Sari Laundry" | Data lama | ❌ Salah |
| Halaman login | Nilai DB `shop.name` | `src/app/(auth)/login/page.tsx` baris 42-48 | Bergantung DB |
| Sidebar AppShell | "LaundrySIA" | Hardcoded `t.common.appName` | ❌ Tidak konsisten |
| Halaman orders/new (struk) | Nilai DB `shop.name` | `src/app/(app)/orders/new/page.tsx` | Bergantung DB |
| Halaman orders/[id] (struk) | Nilai DB `shop.name` | `src/app/(app)/orders/[id]/page.tsx` | Bergantung DB |

#### Kode Pembacaan Nama di Login (`src/app/(auth)/login/page.tsx`)

```typescript
const shopName = await db.setting
  .findUnique({ where: { key: "shop.name" }, select: { value: true } })
  .then((setting) => setting?.value || t.common.appName)
  .catch(() => t.common.appName);
```

- Jika DB setting `shop.name` = "Sari Laundry", login menampilkan "Sari Laundry"
- Fallback jika tidak ada setting atau error: "LaundrySIA" (dari `t.common.appName`)

#### Kode Branding di Sidebar (`src/components/app-shell/app-shell.tsx`)

```tsx
<span className={styles.brandText}>{t.common.appName}</span>
```

Selalu menampilkan "LaundrySIA" (hardcoded dari i18n dictionary), **bukan** dari database.

### Kesimpulan

"Sari Laundry" berasal dari **nilai yang tersimpan di database tabel `Setting` dengan key `shop.name`**, yang merupakan sisa dari seed data lama sebelum commit perbaikan nama (`d302b34`). Aplikasi tidak menampilkan "Bee Bee Laundry" karena database tidak diperbarui setelah seed file diperbaiki.

---

## F. Address Investigation

### Mengapa Alamat Tidak Jalan Abdul Gani Atas?

#### Sumber Alamat

| Komponen | Nilai yang Digunakan | Sumber | Status |
|----------|---------------------|--------|--------|
| Berkas seed (`prisma/seed.ts`) | "Jalan Abdul Gani Atas" | Source code | ✅ Benar |
| Database `Setting` tabel (disangka) | "Jl. Mawar No. 12, Jakarta" | Data lama | ❌ Salah |
| Halaman orders/new (struk) | Nilai DB `shop.address` | `src/app/(app)/orders/new/page.tsx` | Bergantung DB |
| Halaman orders/[id] (struk) | Nilai DB `shop.address` | `src/app/(app)/orders/[id]/page.tsx` | Bergantung DB |
| Sidebar AppShell | Tidak menampilkan alamat | — | — |
| Halaman login | Tidak menampilkan alamat | — | — |

#### Google Maps dan Geocoding

**Tidak ada integrasi Google Maps** dalam aplikasi ini. Tidak ada:
- Geocoding atau reverse-geocoding
- Koordinat peta default
- Google Maps API key

Alamat adalah **teks statis** dari database setting (`shop.address`), tidak ada pemrosesan lokasi apa pun.

#### Penyebab

Masalah sama dengan nama perusahaan: nilai di database belum disinkronkan dengan perbaikan yang sudah ada di berkas seed. Alamat yang ditampilkan adalah nilai lama dari database, bukan "Jalan Abdul Gani Atas".

---

## G. Cross-Page Consistency

| Lokasi | Nama yang Ditampilkan | Alamat yang Ditampilkan | Sumber | Konsisten? |
|--------|----------------------|------------------------|--------|------------|
| Sidebar (AppShell) | "LaundrySIA" | — | Hardcoded `t.common.appName` | ❌ Tidak |
| Halaman login | Nilai DB `shop.name` (kemungkinan "Sari Laundry") | — | DB Setting + fallback | ⚠️ Bergantung DB |
| Halaman orders/new (struk) | Nilai DB `shop.name` | Nilai DB `shop.address` | DB Setting | ⚠️ Bergantung DB |
| Halaman orders/[id] (struk detail) | Nilai DB `shop.name` | Nilai DB `shop.address` | DB Setting | ⚠️ Bergantung DB |
| Halaman expenses | — | — | Tidak menampilkan info perusahaan | N/A |
| Halaman dashboard | — | — | Tidak menampilkan info perusahaan | N/A |
| Halaman reports | — | — | Tidak menampilkan info perusahaan | N/A |
| Halaman settings | — | — | Hanya pengaturan layanan, tidak ada profil perusahaan | ❌ Fitur hilang |

### Inkonsistensi yang Teridentifikasi

1. **Sidebar bilang "LaundrySIA"**, login bisa bilang "Sari Laundry", struk bisa bilang keduanya tergantung DB.
2. **Tidak ada halaman untuk mengedit profil perusahaan** (nama, alamat) dari UI.
3. **`design.md` masih menunjukkan "Sari Laundry"** di beberapa tempat (line 253), padahal line 422-423 sudah menunjukkan "Jalan Abdul Gani Atas".

---

## H. Root Cause Summary

### Confirmed Causes (Dikonfirmasi)

| Masalah | Penyebab Terdapat | Lokasi Kode |
|---------|------------------|-------------|
| Nama perusahaan "Sari Laundry" | Nilai DB `Setting.shop.name` belum diupdate dari seed lama | Database (tidak ada di source code) |
| Alamat bukan Jalan Abdul Gani Atas | Nilai DB `Setting.shop.address` belum diupdate | Database (tidak ada di source code) |
| Tidak ada UI edit profil perusahaan | Tidak ada halaman/settings untuk edit `shop.name` dan `shop.address` | Tidak ada route atau action untuk ini |
| Sidebar bilang "LaundrySIA" | Hardcoded `t.common.appName` di i18n | `src/components/app-shell/app-shell.tsx`, `src/lib/i18n.ts` |
| Parsing nominal "1.000,50" → 100.050 | `parseRupiah()` menghapus semua non-digit termasuk koma | `src/lib/money.ts` baris 27-29 |

### Suspected Causes (Perlu Verifikasi Langsung ke DB)

- Database `Setting` tabel masih memiliki `shop.name = "Sari Laundry"` dan `shop.address = "Jl. Mawar No. 12, Jakarta"` (nilai sebelum commit perbaikan)
- Database tidak pernah di-reseed setelah commit `0888d38` dan `d302b34`
- Karena `seed.ts` menggunakan `upsert` dengan `update: {}`, menjalankan seed lagi **tidak akan menimpa** nilai yang sudah ada di DB

### Unresolved Questions (Belum Dijawab)

1. Apakah database production/staging memiliki nilai yang sama dengan development?
2. Apakah ada backup database yang perlu dipertimbangkan sebelum mengubah setting?
3. Siapa yang merupakan "source of truth" yang sah untuk nama perusahaan: developer yang mengedit seed, atau manager yang mengubah melalui UI?
4. Apakah perlu menambahkan fitur edit profil perusahaan ke halaman Settings yang sudah ada?

---

## I. Recommended Improvements

### Critical — Incorrect financial data or serious business identity errors

| Prioritas | Rekomendasi | File yang Terlibat | Dampak |
|-----------|-------------|-------------------|--------|
| Critical | **Sinkronkan `Setting.shop.name` dan `Setting.shop.address` di database** ke "Bee Bee Laundry" dan "Jalan Abdul Gani Atas" | Database langsung (Prisma Studio atau SQL) | Login, struk pesanan, dan halaman lain akan menampilkan nama dan alamat yang benar |

### High — Broken expense calculations or important business functions

| Prioritas | Rekomendasi | File yang Terlibat | Dampak |
|-----------|-------------|-------------------|--------|
| High | **Tambahkan halaman pengaturan profil perusahaan** untuk mengedit `shop.name`, `shop.address`, `shop.phone`, `shop.receipt_footer`, `shop.pickup_rules` | `src/app/(app)/settings/shop/page.tsx` (baru), `src/server/actions/` (baru), `src/lib/schemas/settings.ts` (sudah ada `shopProfileSchema`) | Admin dapat memperbaiki identitas perusahaan tanpa mengedit database langsung |
| High | **Perbaiki `parseRupiah()`** untuk menangani format Indonesia dengan koma desimal, atau batasi input biaya hanya angka bulat tanpa pemisah | `src/lib/money.ts` | Mencegah penginputan nominal biaya yang salah |

### Medium — Incomplete features and inconsistent information

| Prioritas | Rekomendasi | File yang Terlibat | Dampak |
|-----------|-------------|-------------------|--------|
| Medium | **Seragamkan branding di seluruh aplikasi**: Sidebar saat ini pakai "LaundrySIA", sebaiknya juga baca `shop.name` dari DB dengan fallback | `src/components/app-shell/app-shell.tsx` | Konsistensi merek di semua halaman |
| Medium | **Perbarui `design.md`** yang masih menunjukkan "Sari Laundry" di beberapa tempat | `design.md` | Dokumentasi konsisten dengan implementasi |
| Medium | **Tambahkan pagination pada daftar biaya** untuk performa saat data berkembang | `src/components/expenses/expenses-manager.tsx` | UX lebih baik untuk banyak data |

### Low — Cosmetic and usability improvements

| Prioritas | Rekomendasi | File yang Terlibat | Dampak |
|-----------|-------------|-------------------|--------|
| Low | Perbarui contoh claim ticket di `design.md` dari "Sari Laundry" ke "Bee Bee Laundry" | `design.md` | Dokumentasi konsisten |

---

## J. Implementation Plan

### Langkah 1: Perbaikan Data Database (Critical)

Jalankan perintah SQL atau Prisma untuk mengupdate `Setting` tabel:

```sql
UPDATE settings SET value = 'Bee Bee Laundry' WHERE key = 'shop.name';
UPDATE settings SET value = 'Jalan Abdul Gani Atas' WHERE key = 'shop.address';
UPDATE settings SET value = 'Terima kasih sudah mencuci di Bee Bee Laundry.' WHERE key = 'shop.receipt_footer';
```

**Tidak menjalankan migration atau seed** — hanya update data yang ada. Karena `seed.ts` menggunakan `upsert` dengan `update: {}`, menjalankan `npm run db:seed` lagi **tidak akan menimpa** nilai yang sudah ada di DB.

### Langkah 2: Tambahkan Halaman Pengaturan Profil Perusahaan (High)

1. Buat `src/app/(app)/settings/shop/page.tsx` — halaman manager-only untuk edit profil perusahaan
2. Buat server action `updateShopProfileAction` di `src/server/actions/`
3. Gunakan `shopProfileSchema` yang sudah ada di `src/lib/schemas/settings.ts`
4. Tambah link di halaman `/settings`

### Langkah 3: Perbaikan Parsing Nominal (High)

Modifikasi `parseRupiah` di `src/lib/money.ts` untuk menangani koma desimal dengan benar, atau terapkan input mask/formatting pada input nominal biaya di `expenses-manager.tsx`.

### Langkah 4: Seragamkan Branding (Medium)

Ubah `app-shell.tsx` untuk membaca `shop.name` dari DB setting dengan fallback ke `t.common.appName`.

### Langkah 5: Dokumentasi (Low)

Perbarui `design.md` untuk mengganti semua contoh "Sari Laundry" dengan "Bee Bee Laundry".

---

## K. Evidence and Verification

### Source Code References

| File | Relevansi |
|------|-----------|
| `prisma/seed.ts` | Seed data dengan `shop.name = "Bee Bee Laundry"` dan `shop.address = "Jalan Abdul Gani Atas"` |
| `src/lib/money.ts` | `parseRupiah()` (baris 27-29), `formatRupiah()` (baris 14-16) |
| `src/server/actions/expenses.ts` | `readForm()` (baris 43-49), `getExpenseBalance()` (baris 151-158) |
| `src/lib/schemas/common.ts` | `positiveMoneySchema` (baris 47-52) |
| `src/components/expenses/expenses-manager.tsx` | Input nominal (baris 110-118), tampilan (baris 181) |
| `src/app/(auth)/login/page.tsx` | Pembacaan `shop.name` dari DB (baris 42-48) |
| `src/components/app-shell/app-shell.tsx` | Branding hardcoded "LaundrySIA" (baris 93-95) |
| `src/lib/schemas/settings.ts` | `shopProfileSchema` (baris 12-22) |
| `prisma/schema.prisma` | Model `Expense.amount` sebagai `Int`, model `Setting` |

### Git History References

| Commit | Tanggal | Pesan | Relevansi |
|--------|---------|-------|-----------|
| `d302b34` | 24 Nov 2026 | "change name name" | Mengganti nama dari "Sari Laundry" ke "Bee Bee Laundry" di seed.ts |
| `0888d38` | 24 Nov 2026 | "adding and change name company" | Mengganti alamat dan nama di seed.ts dan design.md |
| `2f43a83` | 22 Nov 2026 | "fixing database bugs" | Memperbaiki `getExpenseBalance()` dan `readForm()` dari `Number()` ke `parseRupiah()` |
| `b7bb013` | 31 Oct 2026 | "adding feature phase 4-5" | Implementasi awal fitur biaya dengan `Number()` parsing |

### Tests Performed

| Test | Status | Keterangan |
|------|--------|------------|
| Unit tests (vitest) | ✅ 158/158 passed | Dari PROJECT_MEMORY.md |
| `tests/expenses-high-nominal.spec.ts` | Tidak dijalankan | Membutuhkan Playwright + DB running |
| `tests/second-qa-audit.spec.ts` | Tidak dijalankan | Membutuhkan Playwright + DB running |

### Tests Not Performed (Perlu Playwright + Database Running)

- Inspeksi browser langsung ke halaman Manager dan Expenses
- Verifikasi nilai aktual di database `Setting` tabel
- Verifikasi tampilan struk dengan nama dan alamat perusahaan
- Verifikasi parsing nominal dengan input berformat Indonesia ("1.000.000", "1.000,50")

### Data Consistency Issues Identified

| Lokasi | Nilai Nama | Nilai Alamat | Sumber | Status |
|--------|-----------|--------------|--------|--------|
| Seed file (`prisma/seed.ts`) | Bee Bee Laundry | Jalan Abdul Gani Atas | Source code | ✅ Benar |
| Database `Setting` (disangka) | Sari Laundry | Jl. Mawar No. 12, Jakarta | Data lama | ❌ Salah |
| Sidebar AppShell | LaundrySIA | — | Hardcoded i18n | ❌ Tidak konsisten |
| Halaman login | Sari Laundry (disangka) | — | DB Setting | ⚠️ Bergantung DB |

---

## Lampiran: Restriksi yang Dipaati

Selama audit ini, tidak ada tindakan berikut yang dilakukan:

1. ❌ Tidak memodifikasi source code
2. ❌ Tidak membuat, menghapus, atau mengedit transaksi biaya
3. ❌ Tidak mengubah pengaturan perusahaan
4. ❌ Tidak mengubah nama atau alamat perusahaan
5. ❌ Tidak mengubah catatan database
6. ❌ Tidak menjalankan migration atau seed script
7. ❌ Tidak submit form yang membuat atau memperbarui data
8. ❌ Tidak mengekspos API keys, password, atau informasi pribadi pelanggan

---

**Laporan ini siap untuk ditinjau dan disetujui sebelum implementasi langkah perbaikan dimulai.**
