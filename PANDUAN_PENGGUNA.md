# Panduan Pengguna LaundrySIA

LaundrySIA adalah aplikasi manajemen laundry yang dilengkapi dengan sistem akuntansi otomatis. Aplikasi ini dirancang untuk mempermudah operasional harian sekaligus memastikan catatan keuangan selalu akurat dan seimbang tanpa perlu pengetahuan akuntansi mendalam.

---

## 🔑 Peran Pengguna

Aplikasi ini memiliki dua tingkat akses yang berbeda untuk menjaga keamanan data:

1.  **Kasir (Cashier)**
    *   **Fokus**: Operasional harian dan pelayanan pelanggan.
    *   **Tugas**: Mencatat pesanan baru, mencari data pelanggan, mengubah status cucian (misalnya dari *Pending* ke *Ready*), dan menerima pembayaran.
    *   **Batasan**: Tidak dapat melihat laporan keuangan, mengatur harga layanan, atau melihat log audit.

2.  **Manajer (Manager)**
    *   **Fokus**: Pengawasan, laporan, dan pengaturan sistem.
    *   **Tugas**: Melihat laporan laba rugi, arus kas, dan neraca; mengelola stok barang; mencatat pengeluaran operasional; mengatur harga layanan; dan memantau log audit.
    *   **Hak Khusus**: Dapat melakukan pembatalan transaksi (*Void*) jika terjadi kesalahan.

---

## 🤖 Bagaimana Sistem Akuntansi Bekerja?

Salah satu keunggulan utama LaundrySIA adalah **Otomatisasi Jurnal**. Anda tidak perlu melakukan pembukuan manual. 

Setiap kali Anda melakukan tindakan di aplikasi, sistem secara otomatis menjalankan aturan akuntansi di belakang layar:
*   **Pesanan Baru**: Menambah piutang (jika belum bayar) dan mencatat potensi pendapatan.
*   **Pembayaran**: Menambah saldo kas/bank dan mengurangi piutang.
*   **Pembelian Stok**: Menambah nilai persediaan dan mengurangi saldo kas.
*   **Pengeluaran**: Mengurangi saldo kas dan mencatat beban/biaya.

**Penting**: Semua transaksi bersifat *immutable* (tidak dapat dihapus). Jika ada kesalahan, sistem akan menggunakan mekanisme **Reversal** (pembatalan dengan entri jurnal pembalik) agar catatan keuangan tetap transparan dan auditabel.

---

## 🚀 Alur Kerja Utama (Workflow)

### 1. Alur Kasir: Melayani Pelanggan

#### **A. Membuat Pesanan (Order)**
1.  Buka menu **Pesanan**.
2.  **Cari/Tambah Pelanggan**: Cari nama atau nomor telepon pelanggan. Jika pelanggan baru, gunakan fitur "Tambah Pelanggan" di dalam form pesanan.
3.  **Pilih Layanan**: Tambahkan item (misalnya: *Wash & Iron*). Masukkan berat (kg) atau jumlah unit. Harga akan muncul otomatis sesuai tarif yang berlaku.
4.  **Pilih Metode Pembayaran**:
    *   **Bayar Lunas**: Pelanggan membayar penuh di awal.
    *   **Deposit**: Pelanggan membayar sebagian (misalnya Rp 50.000). Sisa tagihan akan muncul sebagai piutang.
    *   **Bayar Nanti**: Pesanan dicatat, pembayaran dilakukan saat pengambilan cucian.
5.  **Simpan**: Klik **Simpan Pesanan**. Sistem akan mencetak tiket klaim sebagai bukti untuk pelanggan.

#### **B. Mengelola Status Cucian (Counter Board)**
1.  Buka menu **Counter** untuk melihat papan status pesanan.
2.  Pesanan akan bergerah melalui 5 tahap: **Diterima (Received)** $\rightarrow$ **Dicuci (Washing)** $\rightarrow$ **Pengeringan/Setrika (Drying & Ironing)** $\rightarrow$ **Siap Diambil (Ready)** $\rightarrow$ **Selesai (Completed)**.
3.  Klik tombol panah pada kartu pesanan untuk memajukan status ke tahap berikutnya.

#### **C. Menerima Sisa Pembayaran**
1.  Jika pelanggan memiliki sisa tagihan, pilih pesanan tersebut dan klik **Terima Pembayaran**.
2.  Masukkan jumlah uang yang diterima.
3.  Klik **Simpan**. Saldo kas akan bertambah dan status piutang akan berkurang.

---

### 2. Alur Kerja Manajer: Pengawasan & Laporan

#### **A. Memantau Dashboard**
Gunakan Dashboard untuk melihat ringkasan cepat:
*   **Uang Masuk vs Diterima**: Membandingkan nilai pesanan yang dibuat dengan uang tunai yang benar-benar masuk.
*   **Stok Menipis**: Notifikasi otomatis jika bahan laundry (deterjen, dll) hampir habis.
*   **Pesanan Siap**: Daftar cucian yang sudah selesai dan menunggu diambil.

#### **B. Menjalankan Laporan Keuangan**
Buka menu **Laporan** untuk melihat:
*   **Laporan Laba Rugi**: Melihat keuntungan bersih (Pendapatan dikurangi Biaya).
*   **Arus Kas (Cash Flow)**: Melihat pergerakan uang masuk dan keluar.
*   **Neraca (Balance Sheet)**: Melihat total aset (Kas, Piutang, Stok) dan posisi modal.

#### **C. Manajemen Stok & Pengeluaran**
*   **Pembelian Stok**: Gunakan untuk mencatat saat Anda membeli deterjen atau pewangi. Ini akan menambah stok dan mengurangi saldo kas secara otomatis.
*   **Pemakaian Stok**: Catat penggunaan bahan baku agar jumlah stok di sistem tetap akurat.
*   **Pengeluaran**: Gunakan untuk mencatat biaya di luar stok (seperti listrik, air, atau gaji karyawan).

---

## ⚠️ Aturan Penting & Tips

1.  **Jangan Menghapus Data**: Jika terjadi kesalahan input, jangan mencoba mencari cara untuk menghapusnya. Gunakan fitur **Void** (untuk Manajer) atau catat pembatalan melalui transaksi baru.
2.  **Akurasi Berat**: Pastikan memasukkan berat cucian dengan benar karena ini adalah dasar perhitungan pendapatan dan penggunaan stok.
3.  **Cetak Tiket**: Gunakan printer thermal 80mm untuk tiket kecil yang praktis, atau pilih format A5 jika diperlukan dokumen yang lebih formal.
4.  **Keamanan**: Selalu lakukan **Logout** setelah selesai bekerja, terutama jika menggunakan perangkat di area publik.
