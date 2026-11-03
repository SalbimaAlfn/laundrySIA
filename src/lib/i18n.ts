/**
 * All user-facing text goes through a dictionary so English can be added
 * without touching components. Phase 1 needs the validation slice; screens
 * and microcopy are added as they are built.
 */
export type Locale = "id" | "en";

export type ValidationMessages = {
  required: string;
  number: string;
  id: string;
  name: string;
  phone: string;
  address: string;
  textTooLong: string;
  username: string;
  password: string;
  role: string;
  amount: string;
  amountNegative: string;
  amountTooLarge: string;
  discount: string;
  discountExceedsSubtotal: string;
  note: string;
  items: string;
  quantity: string;
  date: string;
  paymentType: string;
  paymentMethod: string;
  depositAmount: string;
  depositMustBeLess: string;
  laterPayment: string;
  paymentTooMuch: string;
  paymentVoided: string;
  serviceName: string;
  unit: string;
  price: string;
  turnaround: string;
  voidReason: string;
  category: string;
  paidFrom: string;
  supplyQuantity: string;
  totalCost: string;
  openingAmount: string;
};

export type AuthMessages = {
  title: string;
  lead: string;
  username: string;
  password: string;
  submit: string;
  showPassword: string;
  hidePassword: string;
  invalidCredentials: string;
  inactiveAccount: string;
  sessionEnded: string;
  loggedOut: string;
  managerOnly: string;
  unavailable: string;
};

export type NavMessages = {
  primary: string;
  menu: string;
  dashboard: string;
  counter: string;
  newOrder: string;
  orders: string;
  customers: string;
  receivables: string;
  expenses: string;
  stock: string;
  reports: string;
  settings: string;
  audit: string;
  more: string;
  searchLabel: string;
  searchPlaceholder: string;
  search: string;
};

export type CommonMessages = {
  appName: string;
  skipToContent: string;
  logOut: string;
  closeDialog: string;
  comingSoon: string;
  comingSoonBody: string;
  cancel: string;
  save: string;
  genericError: string;
};

export type CustomerMessages = {
  title: string;
  lead: string;
  searchLabel: string;
  searchPlaceholder: string;
  search: string;
  searching: string;
  add: string;
  addTitle: string;
  editTitle: string;
  name: string;
  phone: string;
  phoneHint: string;
  address: string;
  addressHint: string;
  save: string;
  cancel: string;
  savedCreate: string;
  savedUpdate: string;
  duplicatePhone: string;
  empty: string;
  emptySearch: string;
  noResults: string;
  listCaption: string;
  status: string;
  active: string;
  inactive: string;
  activate: string;
  deactivate: string;
  activated: string;
  deactivated: string;
  inactiveHint: string;
  edit: string;
  quickAdd: string;
  quickAddTitle: string;
  quickAddHint: string;
  selected: string;
};

export type ServiceMessages = {
  title: string;
  lead: string;
  add: string;
  addTitle: string;
  editTitle: string;
  name: string;
  nameHint: string;
  unit: string;
  unitKg: string;
  unitPiece: string;
  price: string;
  priceHint: string;
  turnaround: string;
  turnaroundUnit: string;
  turnaroundHint: string;
  status: string;
  active: string;
  inactive: string;
  activate: string;
  deactivate: string;
  activated: string;
  deactivated: string;
  savedCreate: string;
  savedUpdate: string;
  priceChanged: string;
  duplicate: string;
  empty: string;
  listCaption: string;
  edit: string;
  save: string;
  cancel: string;
  isActive: string;
};

export type OrderFormMessages = {
  title: string;
  customer: string;
  services: string;
  service: string;
  chooseService: string;
  kg: string;
  piece: string;
  addService: string;
  removeService: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  subtotal: string;
  discount: string;
  total: string;
  pickupDate: string;
  note: string;
  notePlaceholder: string;
  paymentNow: string;
  payInFull: string;
  deposit: string;
  payLater: string;
  amount: string;
  method: string;
  cash: string;
  transfer: string;
  ewallet: string;
  paidNow: string;
  leftToPay: string;
  saveOrder: string;
  saved: string;
  ticket: string;
  invoicePending: string;
  newOrder: string;
  print: string;
  printSize: string;
  thermal: string;
  a5: string;
  paidStamp: string;
  shopNameFallback: string;
  noServices: string;
};

export type RoleMessages = {
  CASHIER: string;
  MANAGER: string;
};

export type OrderMessages = {
  title: string; detailTitle: string; lead: string; orders: string; newOrder: string; status: string;
  statusReceived: string; statusWashing: string; statusDrying: string; statusReady: string;
  statusCompleted: string; statusVoid: string; date: string; customer: string; total: string;
  paid: string; balance: string; view: string; allStatus: string; payment: string;
  allPayment: string; unpaid: string; partial: string; search: string; clear: string;
  listCaption: string; empty: string; page: string; of: string; previous: string; next: string;
  customerPlaceholder: string; invoicePlaceholder: string; invoice: string; backToList: string;
  items: string; service: string; qty: string; unitPrice: string; subtotal: string; discount: string;
  payments: string; method: string; amount: string; receivedBy: string; summary: string;
  settled: string; pickupDate: string; note: string; advanceStatus: string; reverseStatus: string;
  statusAdvanced: string; statusReversed: string; receivePayment: string; voided: string; voidedBy: string;
  paymentSaved: string;
  // Override messages
  balanceRemainsError: string;
  managerRequiredError: string;
  overrideTitle: string;
  overrideMessage: string;
  overrideMessage2: string;
  overrideNoteLabel: string;
  overrideNotePlaceholder: string;
  overrideNoteRequired: string;
  overrideConfirm: string;
  voidOrder: string;
  voidTitle: string;
  voidWarning: string;
  voidReasonLabel: string;
  voidReasonPlaceholder: string;
  voidConfirm: string;
  voidedSuccess: string;
  alreadyVoided: string;
};

export type CounterBoardMessages = {
  activeOrders: string;
  readyOrders: string;
  leftToPay: string;
  emptyColumn: string;
};

export type ReceivablesMessages = {
  totalOwed: string;
  days: string;
  empty: string;
};

export type ExpenseMessages = {
  title: string;
  lead: string;
  add: string;
  addTitle: string;
  category: string;
  amount: string;
  paidFrom: string;
  date: string;
  note: string;
  notePlaceholder: string;
  savedCreate: string;
  empty: string;
  saved: string;
  reverse: string;
  reverseReasonRequired: string;
  reverseReasonPlaceholder: string;
  reversed: string;
  reversedTitle: string;
  listTitle: string;
  createdBy: string;
};

export type StockMessages = {
  title: string;
  lead: string;
  addSupply: string;
  addPurchase: string;
  addUsage: string;
  newSupply: string;
  newPurchase: string;
  newUsage: string;
  usageSaved: string;
  supply: string;
  name: string;
  unit: string;
  quantity: string;
  totalCost: string;
  minQty: string;
  minStock: string;
  stock: string;
  avgCost: string;
  date: string;
  note: string;
  paidFrom: string;
  lowStock: string;
  selectSupply: string;
  noSupplies: string;
  noMovements: string;
  movements: string;
  suppliesList: string;
  in: string;
  out: string;
  purchaseSaved: string;
  supplySaved: string;
  createdBy: string;
  type: string;
};

export type ReportMessages = {
  title: string;
  lead: string;
  incomeStatement: string;
  cashFlow: string;
  balanceSheet: string;
  sales: string;
  ledger: string;
  trialBalance: string;
  from: string;
  to: string;
  asOf: string;
  account: string;
  apply: string;
  print: string;
  export: string;
  period: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  custom: string;
  revenue: string;
  expenses: string;
  profit: string;
  cashIn: string;
  cashOut: string;
  netCash: string;
  openingCash: string;
  closingCash: string;
  assets: string;
  equity: string;
  balanced: string;
  notBalanced: string;
  code: string;
  accountName: string;
  debit: string;
  credit: string;
  balance: string;
  total: string;
  service: string;
  quantity: string;
  day: string;
  date: string;
  orders: string;
  noData: string;
  summaryIncome: string;
  summaryCash: string;
  summaryBalance: string;
  summarySales: string;
  summaryLedger: string;
  summaryTrial: string;
  orderPayments: string;
  other: string;
};

export type DashboardMessages = {
  title: string;
  earnedToday: string;
  receivedToday: string;
  toCollect: string;
  lowStock: string;
  readyOrders: string;
  last7Days: string;
  noLowStock: string;
  noReady: string;
  noCollect: string;
  viewAll: string;
  chartLabel: string;
};

export type AuditMessages = {
  title: string;
  lead: string;
  user: string;
  action: string;
  entity: string;
  date: string;
  from: string;
  to: string;
  filter: string;
  clear: string;
  empty: string;
  allUsers: string;
  allActions: string;
};

export type Dictionary = {
  validation: ValidationMessages;
  auth: AuthMessages;
  nav: NavMessages;
  common: CommonMessages;
  roles: RoleMessages;
  customers: CustomerMessages;
  services: ServiceMessages;
  orderForm: OrderFormMessages;
  orders: OrderMessages;
  counterBoard: CounterBoardMessages;
  receivables: ReceivablesMessages;
  expenses: ExpenseMessages;
  stock: StockMessages;
  reports: ReportMessages;
  dashboard: DashboardMessages;
  audit: AuditMessages;
};

const id: Dictionary = {
  validation: {
    required: "Wajib diisi.",
    number: "Masukkan angka yang valid.",
    id: "Pilih data yang valid.",
    name: "Nama harus 2 sampai 80 karakter.",
    phone: "Nomor telepon harus 9 sampai 14 digit dan diawali 0.",
    address: "Alamat maksimal 200 karakter.",
    textTooLong: "Teks maksimal 200 karakter.",
    username:
      "Username harus 3 sampai 32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung.",
    password: "Kata sandi minimal 10 karakter dan harus memuat huruf dan angka.",
    role: "Peran tidak valid.",
    amount: "Jumlah harus lebih dari 0.",
    amountNegative: "Jumlah tidak boleh negatif.",
    amountTooLarge: "Jumlah terlalu besar.",
    discount: "Diskon tidak boleh negatif.",
    discountExceedsSubtotal: "Diskon tidak boleh melebihi subtotal.",
    note: "Catatan maksimal 200 karakter.",
    items: "Tambahkan minimal satu layanan, maksimal 20 baris.",
    quantity: "Jumlah harus antara 0,01 dan 999,99.",
    date: "Tanggal tidak valid.",
    paymentType: "Jenis pembayaran tidak valid.",
    paymentMethod: "Metode pembayaran tidak valid.",
    depositAmount: "Uang muka harus lebih dari 0.",
    depositMustBeLess: "Uang muka harus lebih kecil dari total.",
    laterPayment: "Pembayaran belakangan tidak boleh menyertakan jumlah.",
    paymentTooMuch: "Jumlah pembayaran melebihi sisa tagihan.",
    paymentVoided: "Pesanan dibatalkan dan tidak dapat menerima pembayaran.",
    serviceName: "Nama layanan harus 2 sampai 80 karakter.",
    unit: "Satuan tidak valid.",
    price: "Harga harus lebih dari 0.",
    turnaround: "Estimasi selesai harus 0 sampai 30 hari.",
    voidReason: "Alasan pembatalan harus 5 sampai 200 karakter.",
    category: "Kategori pengeluaran tidak valid.",
    paidFrom: "Sumber dana tidak valid.",
    supplyQuantity: "Jumlah harus lebih dari 0 dan maksimal 9.999,99.",
    totalCost: "Total biaya harus lebih dari 0.",
    openingAmount: "Isi minimal satu saldo awal lebih dari 0.",
  },
  auth: {
    title: "Masuk",
    lead: "Masuk untuk mulai mencatat pesanan dan pembayaran.",
    username: "Username",
    password: "Kata sandi",
    submit: "Masuk",
    showPassword: "Tampilkan kata sandi",
    hidePassword: "Sembunyikan kata sandi",
    invalidCredentials: "Username atau kata sandi tidak cocok.",
    inactiveAccount: "Akun ini dinonaktifkan. Hubungi manajer.",
    sessionEnded: "Sesi berakhir karena akun Anda dinonaktifkan.",
    loggedOut: "Anda sudah keluar.",
    managerOnly: "Hanya manajer yang dapat membuka halaman itu.",
    unavailable: "Tidak dapat masuk sekarang. Coba lagi sebentar lagi.",
  },
  nav: {
    primary: "Navigasi utama",
    menu: "Menu",
    dashboard: "Dashboard",
    counter: "Counter",
    newOrder: "Pesanan baru",
    orders: "Pesanan",
    customers: "Pelanggan",
    receivables: "Piutang",
    expenses: "Pengeluaran",
    stock: "Stok",
    reports: "Laporan",
    settings: "Pengaturan",
    audit: "Audit",
    more: "Lainnya",
    searchLabel: "Cari pesanan atau pelanggan",
    searchPlaceholder: "Cari pesanan atau nama",
    search: "Cari",
  },
  common: {
    appName: "LaundrySIA",
    skipToContent: "Lewati ke konten",
    logOut: "Keluar",
    closeDialog: "Tutup dialog",
    comingSoon: "Halaman ini sedang disiapkan",
    comingSoonBody: "Isi halaman akan ditambahkan pada tahap berikutnya.",
    cancel: "Batal",
    save: "Simpan",
    genericError: "Tidak dapat menyimpan sekarang. Coba lagi sebentar lagi.",
  },
  roles: {
    CASHIER: "Kasir",
    MANAGER: "Manajer",
  },
  customers: {
    title: "Pelanggan",
    lead: "Cari pelanggan, atau tambahkan yang baru.",
    searchLabel: "Cari pelanggan",
    searchPlaceholder: "Nama atau nomor telepon",
    search: "Cari",
    searching: "Mencari pelanggan...",
    add: "Tambah pelanggan",
    addTitle: "Pelanggan baru",
    editTitle: "Ubah pelanggan",
    name: "Nama",
    phone: "Nomor telepon",
    phoneHint: "Contoh 0812 3456 7890. Satu nomor hanya untuk satu pelanggan.",
    address: "Alamat (opsional)",
    addressHint: "Maksimal 200 karakter.",
    save: "Simpan pelanggan",
    cancel: "Batal",
    savedCreate: "Pelanggan ditambahkan.",
    savedUpdate: "Perubahan pelanggan disimpan.",
    duplicatePhone: "Pelanggan dengan nomor telepon ini sudah terdaftar. Pilih pelanggan tersebut.",
    empty: "Belum ada pelanggan. Tambahkan pelanggan pertama.",
    emptySearch: "Tidak ada pelanggan yang cocok. Coba nama atau nomor lain.",
    noResults: "Tidak ada pelanggan yang cocok.",
    listCaption: "Daftar pelanggan",
    status: "Status",
    active: "Aktif",
    inactive: "Nonaktif",
    activate: "Aktifkan",
    deactivate: "Nonaktifkan",
    activated: "Pelanggan diaktifkan.",
    deactivated: "Pelanggan dinonaktifkan.",
    inactiveHint: "Pelanggan nonaktif disembunyikan saat membuat pesanan baru.",
    edit: "Ubah",
    quickAdd: "Tambah pelanggan baru",
    quickAddTitle: "Pelanggan baru",
    quickAddHint: "Pelanggan langsung terpilih setelah disimpan.",
    selected: "Pelanggan terpilih",
  },
  services: {
    title: "Layanan dan harga",
    lead: "Atur layanan yang bisa dipilih saat membuat pesanan.",
    add: "Tambah layanan",
    addTitle: "Layanan baru",
    editTitle: "Ubah layanan",
    name: "Nama layanan",
    nameHint: "Contoh Cuci kering, Cuci setrika, Setrika saja.",
    unit: "Satuan",
    unitKg: "Kg",
    unitPiece: "Satuan",
    price: "Harga",
    priceHint: "Per kg atau per satuan, dalam rupiah.",
    turnaround: "Estimasi selesai",
    turnaroundUnit: "hari",
    turnaroundHint: "0 berarti selesai di hari yang sama.",
    status: "Status",
    active: "Aktif",
    inactive: "Nonaktif",
    activate: "Aktifkan",
    deactivate: "Nonaktifkan",
    activated: "Layanan diaktifkan.",
    deactivated: "Layanan dinonaktifkan.",
    savedCreate: "Layanan ditambahkan.",
    savedUpdate: "Perubahan layanan disimpan.",
    priceChanged: "Harga layanan diubah. Pesanan lama tidak berubah.",
    duplicate: "Nama layanan sudah dipakai. Pilih nama lain.",
    empty: "Belum ada layanan. Tambahkan layanan pertama.",
    listCaption: "Daftar layanan",
    edit: "Ubah",
    save: "Simpan layanan",
    cancel: "Batal",
    isActive: "Layanan aktif dan bisa dipilih saat membuat pesanan",
  },
  orderForm: {
    title: "Pesanan baru",
    customer: "Pelanggan",
    services: "Layanan",
    service: "Layanan",
    chooseService: "Pilih layanan",
    kg: "kg",
    piece: "satuan",
    addService: "Tambah layanan",
    removeService: "Hapus layanan",
    quantity: "Berat atau jumlah",
    unitPrice: "Harga satuan",
    lineTotal: "Jumlah",
    subtotal: "Subtotal",
    discount: "Diskon",
    total: "Total",
    pickupDate: "Tanggal selesai",
    note: "Catatan",
    notePlaceholder: "Catatan untuk pesanan ini (opsional)",
    paymentNow: "Pembayaran sekarang",
    payInFull: "Bayar lunas",
    deposit: "Uang muka",
    payLater: "Bayar nanti",
    amount: "Jumlah uang muka",
    method: "Metode pembayaran",
    cash: "Tunai",
    transfer: "Transfer bank",
    ewallet: "Dompet digital",
    paidNow: "Dibayar sekarang",
    leftToPay: "Sisa pembayaran",
    saveOrder: "Simpan pesanan",
    saved: "Pesanan disimpan.",
    ticket: "Tiket klaim",
    invoicePending: "Nomor dibuat saat disimpan",
    newOrder: "Pesanan baru",
    print: "Cetak tiket",
    printSize: "Ukuran cetak",
    thermal: "Thermal 80 mm",
    a5: "Invoice A5",
    paidStamp: "Lunas",
    shopNameFallback: "Laundry",
    noServices: "Belum ada layanan aktif. Minta manajer menambahkan layanan.",
  },
  orders: {
    title: "Daftar pesanan", detailTitle: "Detail pesanan", lead: "Total pesanan:", orders: "pesanan", newOrder: "Pesanan baru",
    status: "Status", statusReceived: "Diterima", statusWashing: "Dicuci", statusDrying: "Pengeringan dan setrika",
    statusReady: "Siap diambil", statusCompleted: "Selesai", statusVoid: "Dibatalkan", date: "Tanggal",
    customer: "Pelanggan", total: "Total", paid: "Dibayar", balance: "Sisa", view: "Lihat",
    allStatus: "Semua status", payment: "Pembayaran", allPayment: "Semua pembayaran", unpaid: "Belum dibayar",
    partial: "Sebagian", search: "Cari", clear: "Hapus filter", listCaption: "Daftar pesanan",
    empty: "Pesanan tidak ditemukan.", page: "Halaman", of: "dari", previous: "Sebelumnya", next: "Berikutnya",
    customerPlaceholder: "Nama atau nomor telepon", invoicePlaceholder: "Nomor invoice", invoice: "Invoice",
    backToList: "Kembali ke daftar pesanan", items: "Rincian layanan", service: "Layanan", qty: "Jumlah",
    unitPrice: "Harga satuan", subtotal: "Subtotal", discount: "Diskon", payments: "Riwayat pembayaran",
    method: "Metode", amount: "Jumlah", receivedBy: "Diterima oleh", summary: "Ringkasan pembayaran",
    settled: "Lunas", pickupDate: "Tanggal selesai", note: "Catatan", advanceStatus: "Lanjutkan status",
    reverseStatus: "Kembalikan status", statusAdvanced: "Status pesanan diperbarui.",
    statusReversed: "Status pesanan dikembalikan.", receivePayment: "Terima pembayaran", voided: "Pesanan dibatalkan",
    voidedBy: "Dibatalkan oleh",
    paymentSaved: "Pembayaran tersimpan. Sisa tagihan sekarang",
    // Override messages
    balanceRemainsError: "Pesanan ini masih memiliki sisa tagihan. Hanya manajer yang dapat memaksa status Selesai.",
    managerRequiredError: "Hanya manajer yang dapat mengoverride saldo tersisa.",
    overrideTitle: "Override Selesai",
    overrideMessage: "Pesanan ini masih memiliki sisa tagihan",
    overrideMessage2: "Hanya manajer yang dapat memaksa status Selesai dengan catatan.",
    overrideNoteLabel: "Catatan override (wajib)",
    overrideNotePlaceholder: "Masukkan alasan memaksa selesai...",
    overrideNoteRequired: "Catatan override wajib diisi.",
    overrideConfirm: "Konfirmasi override",
    voidOrder: "Batalkan pesanan",
    voidTitle: "Batalkan pesanan",
    voidWarning: "Pesanan akan dibatalkan dan semua jurnalnya dibalik. Uang yang harus dikembalikan:",
    voidReasonLabel: "Alasan pembatalan (wajib)",
    voidReasonPlaceholder: "Masukkan alasan pembatalan...",
    voidConfirm: "Konfirmasi pembatalan",
    voidedSuccess: "Pesanan dibatalkan dan jurnal dibalik.",
    alreadyVoided: "Pesanan ini sudah dibatalkan.",
  },
  counterBoard: {
    activeOrders: "Pesanan berjalan",
    readyOrders: "Siap diambil",
    leftToPay: "Sisa pembayaran",
    emptyColumn: "Belum ada pesanan di status ini.",
  },
  receivables: {
    totalOwed: "Total piutang",
    days: "hari",
    empty: "Tidak ada pesanan dengan sisa pembayaran.",
  },
  expenses: {
    title: "Pengeluaran",
    lead: "Kelola pengeluaran operasional.",
    add: "Tambah pengeluaran",
    addTitle: "Pengeluaran baru",
    category: "Kategori",
    amount: "Jumlah",
    paidFrom: "Dibayar dari",
    date: "Tanggal",
    note: "Catatan",
    notePlaceholder: "Catatan opsional...",
    savedCreate: "Pengeluaran ditambahkan.",
    empty: "Belum ada pengeluaran.",
    listTitle: "Daftar pengeluaran",
    createdBy: "Dibuat oleh",
    reversedTitle: "Dibatalkan",
    reversed: "Dibatalkan",
    reverse: "Batalkan",
    reverseReasonPlaceholder: "Alasan pembatalan...",
    reverseReasonRequired: "Alasan pembatalan wajib diisi (5-200 karakter).",
    saved: "Pengeluaran disimpan.",
  },
  stock: {
    title: "Stok supplies",
    lead: "Kelola supplies, pembelian, dan pemakaian.",
    addSupply: "Tambah supply",
    addPurchase: "Catat pembelian",
    addUsage: "Catat pemakaian",
    newSupply: "Supply baru",
    newPurchase: "Pembelian supplies",
    newUsage: "Pemakaian supplies",
    usageSaved: "Pemakaian supplies disimpan.",
    supply: "Supply",
    name: "Nama",
    unit: "Satuan",
    quantity: "Jumlah",
    totalCost: "Total biaya",
    minQty: "Batas minimum",
    minStock: "Min",
    stock: "Stok",
    avgCost: "Harga rata-rata",
    date: "Tanggal",
    note: "Catatan",
    paidFrom: "Dibayar dari",
    lowStock: "Stok rendah:",
    selectSupply: "Pilih supply",
    noSupplies: "Belum ada supply.",
    noMovements: "Belum ada riwayat.",
    movements: "Riwayat movements",
    suppliesList: "Daftar supplies",
    in: "Masuk",
    out: "Keluar",
    purchaseSaved: "Pembelian supplies disimpan.",
    supplySaved: "Supply ditambahkan.",
    createdBy: "Dibuat oleh",
    type: "Jenis",
  },
  reports: {
    title: "Laporan",
    lead: "Pilih laporan untuk melihat angka dan ringkasannya.",
    incomeStatement: "Laba rugi",
    cashFlow: "Arus kas",
    balanceSheet: "Neraca",
    sales: "Penjualan",
    ledger: "Buku besar",
    trialBalance: "Neraca saldo",
    from: "Dari",
    to: "Sampai",
    asOf: "Per tanggal",
    account: "Akun",
    apply: "Terapkan",
    print: "Cetak",
    export: "Ekspor CSV",
    period: "Periode",
    today: "Hari ini",
    thisWeek: "Minggu ini",
    thisMonth: "Bulan ini",
    custom: "Kustom",
    revenue: "Pendapatan",
    expenses: "Beban",
    profit: "Laba",
    cashIn: "Kas masuk",
    cashOut: "Kas keluar",
    netCash: "Arus kas bersih",
    openingCash: "Kas awal",
    closingCash: "Kas akhir",
    assets: "Aset",
    equity: "Ekuitas",
    balanced: "Aset sama dengan ekuitas.",
    notBalanced: "Aset tidak sama dengan ekuitas. Periksa jurnal.",
    code: "Kode",
    accountName: "Nama akun",
    debit: "Debit",
    credit: "Kredit",
    balance: "Saldo",
    total: "Total",
    service: "Layanan",
    quantity: "Jumlah",
    day: "Hari",
    date: "Tanggal",
    orders: "Pesanan",
    noData: "Belum ada data pada periode ini.",
    summaryIncome: "Pendapatan dikurangi beban menghasilkan laba",
    summaryCash: "Kas awal ditambah arus kas bersih menjadi kas akhir",
    summaryBalance: "Total aset dan ekuitas pada tanggal ini",
    summarySales: "Total penjualan pada periode ini",
    summaryLedger: "Mutasi akun pada periode ini",
    summaryTrial: "Total debit dan kredit harus sama.",
    orderPayments: "Pembayaran pesanan",
    other: "Lainnya",
  },
  dashboard: {
    title: "Dasbor",
    earnedToday: "Pendapatan hari ini",
    receivedToday: "Kas diterima hari ini",
    toCollect: "Masih harus ditagih",
    lowStock: "Stok rendah",
    readyOrders: "Siap diambil",
    last7Days: "Pendapatan 7 hari terakhir",
    noLowStock: "Semua stok aman.",
    noReady: "Belum ada pesanan siap diambil.",
    noCollect: "Tidak ada tagihan terbuka.",
    viewAll: "Lihat semua",
    chartLabel: "Grafik pendapatan tujuh hari terakhir",
  },
  audit: {
    title: "Log audit",
    lead: "Riwayat tindakan pengguna di aplikasi.",
    user: "Pengguna",
    action: "Tindakan",
    entity: "Entitas",
    date: "Tanggal",
    from: "Dari",
    to: "Sampai",
    filter: "Terapkan",
    clear: "Hapus filter",
    empty: "Belum ada catatan audit.",
    allUsers: "Semua pengguna",
    allActions: "Semua tindakan",
  },
};

const en: Dictionary = {
  validation: {
    required: "This field is required.",
    number: "Enter a valid number.",
    id: "Choose a valid record.",
    name: "Name must be 2 to 80 characters.",
    phone: "Phone number must be 9 to 14 digits and start with 0.",
    address: "Address must be at most 200 characters.",
    textTooLong: "Text must be at most 200 characters.",
    username:
      "Username must be 3 to 32 characters: lowercase letters, digits, dots, underscores, or hyphens.",
    password: "Password must be at least 10 characters and contain a letter and a digit.",
    role: "Invalid role.",
    amount: "Amount must be greater than 0.",
    amountNegative: "Amount cannot be negative.",
    amountTooLarge: "Amount is too large.",
    discount: "Discount cannot be negative.",
    discountExceedsSubtotal: "Discount cannot exceed the subtotal.",
    note: "Note must be at most 200 characters.",
    items: "Add at least one service line, up to 20 lines.",
    quantity: "Quantity must be between 0.01 and 999.99.",
    date: "Invalid date.",
    paymentType: "Invalid payment type.",
    paymentMethod: "Invalid payment method.",
    depositAmount: "Deposit must be greater than 0.",
    depositMustBeLess: "Deposit must be less than the total.",
    laterPayment: "Pay later cannot include an amount.",
    paymentTooMuch: "Payment exceeds the remaining balance.",
    paymentVoided: "Voided orders cannot receive payments.",
    serviceName: "Service name must be 2 to 80 characters.",
    unit: "Invalid unit.",
    price: "Price must be greater than 0.",
    turnaround: "Turnaround must be 0 to 30 days.",
    voidReason: "Void reason must be 5 to 200 characters.",
    category: "Invalid expense category.",
    paidFrom: "Invalid payment source.",
    supplyQuantity: "Quantity must be greater than 0 and at most 9,999.99.",
    totalCost: "Total cost must be greater than 0.",
    openingAmount: "Enter at least one opening balance greater than 0.",
  },
  auth: {
    title: "Log in",
    lead: "Log in to start recording orders and payments.",
    username: "Username",
    password: "Password",
    submit: "Log in",
    showPassword: "Show password",
    hidePassword: "Hide password",
    invalidCredentials: "Username or password is not correct.",
    inactiveAccount: "This account is deactivated. Contact a manager.",
    sessionEnded: "Your session ended because your account was deactivated.",
    loggedOut: "You have been logged out.",
    managerOnly: "Only a manager can open that page.",
    unavailable: "Cannot log in right now. Please try again shortly.",
  },
  nav: {
    primary: "Main navigation",
    menu: "Menu",
    dashboard: "Dashboard",
    counter: "Counter",
    newOrder: "New order",
    orders: "Orders",
    customers: "Customers",
    receivables: "Receivables",
    expenses: "Expenses",
    stock: "Stock",
    reports: "Reports",
    settings: "Settings",
    audit: "Audit",
    more: "More",
    searchLabel: "Search orders or customers",
    searchPlaceholder: "Search order or name",
    search: "Search",
  },
  common: {
    appName: "LaundrySIA",
    skipToContent: "Skip to content",
    logOut: "Log out",
    closeDialog: "Close dialog",
    comingSoon: "This page is being prepared",
    comingSoonBody: "The page content will be added in a later phase.",
    cancel: "Cancel",
    save: "Save",
    genericError: "Cannot save right now. Please try again shortly.",
  },
  roles: {
    CASHIER: "Cashier",
    MANAGER: "Manager",
  },
  customers: {
    title: "Customers",
    lead: "Find a customer, or add a new one.",
    searchLabel: "Search customers",
    searchPlaceholder: "Name or phone number",
    search: "Search",
    searching: "Searching customers...",
    add: "Add customer",
    addTitle: "New customer",
    editTitle: "Edit customer",
    name: "Name",
    phone: "Phone number",
    phoneHint: "For example 0812 3456 7890. One number belongs to one customer.",
    address: "Address (optional)",
    addressHint: "At most 200 characters.",
    save: "Save customer",
    cancel: "Cancel",
    savedCreate: "Customer added.",
    savedUpdate: "Customer changes saved.",
    duplicatePhone: "A customer with this phone number already exists. Select them instead.",
    empty: "No customers yet. Add the first customer.",
    emptySearch: "No customers match. Try another name or number.",
    noResults: "No customers match.",
    listCaption: "Customer list",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    activate: "Activate",
    deactivate: "Deactivate",
    activated: "Customer activated.",
    deactivated: "Customer deactivated.",
    inactiveHint: "Inactive customers are hidden when creating a new order.",
    edit: "Edit",
    quickAdd: "Add a new customer",
    quickAddTitle: "New customer",
    quickAddHint: "The customer is selected automatically after saving.",
    selected: "Selected customer",
  },
  services: {
    title: "Services and prices",
    lead: "Set the services available when creating an order.",
    add: "Add service",
    addTitle: "New service",
    editTitle: "Edit service",
    name: "Service name",
    nameHint: "For example Wash and dry, Wash and iron, Iron only.",
    unit: "Unit",
    unitKg: "Kg",
    unitPiece: "Piece",
    price: "Price",
    priceHint: "Per kg or per piece, in rupiah.",
    turnaround: "Turnaround",
    turnaroundUnit: "days",
    turnaroundHint: "0 means ready the same day.",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    activate: "Activate",
    deactivate: "Deactivate",
    activated: "Service activated.",
    deactivated: "Service deactivated.",
    savedCreate: "Service added.",
    savedUpdate: "Service changes saved.",
    priceChanged: "Service price changed. Existing orders are unchanged.",
    duplicate: "That service name is already used. Choose another name.",
    empty: "No services yet. Add the first service.",
    listCaption: "Service list",
    edit: "Edit",
    save: "Save service",
    cancel: "Cancel",
    isActive: "Service is active and can be chosen when creating an order",
  },
  orderForm: {
    title: "New order",
    customer: "Customer",
    services: "Services",
    service: "Service",
    chooseService: "Choose a service",
    kg: "kg",
    piece: "piece",
    addService: "Add service",
    removeService: "Remove service",
    quantity: "Weight or quantity",
    unitPrice: "Unit price",
    lineTotal: "Amount",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
    pickupDate: "Pickup date",
    note: "Note",
    notePlaceholder: "Note for this order (optional)",
    paymentNow: "Payment now",
    payInFull: "Pay in full",
    deposit: "Deposit",
    payLater: "Pay later",
    amount: "Deposit amount",
    method: "Payment method",
    cash: "Cash",
    transfer: "Bank transfer",
    ewallet: "E-wallet",
    paidNow: "Paid now",
    leftToPay: "Left to pay",
    saveOrder: "Save order",
    saved: "Order saved.",
    ticket: "Claim ticket",
    invoicePending: "Number assigned when saved",
    newOrder: "New order",
    print: "Print ticket",
    printSize: "Print size",
    thermal: "80 mm thermal",
    a5: "A5 invoice",
    paidStamp: "Paid",
    shopNameFallback: "Laundry",
    noServices: "No active services. Ask a manager to add a service.",
  },
  orders: {
    title: "Orders", detailTitle: "Order details", lead: "Total orders:", orders: "orders", newOrder: "New order", status: "Status",
    statusReceived: "Received", statusWashing: "Washing", statusDrying: "Drying and ironing", statusReady: "Ready",
    statusCompleted: "Completed", statusVoid: "Voided", date: "Date", customer: "Customer", total: "Total",
    paid: "Paid", balance: "Balance", view: "View", allStatus: "All statuses", payment: "Payment",
    allPayment: "All payments", unpaid: "Unpaid", partial: "Partial", search: "Search", clear: "Clear filters",
    listCaption: "Order list", empty: "No orders found.", page: "Page", of: "of", previous: "Previous", next: "Next",
    customerPlaceholder: "Name or phone number", invoicePlaceholder: "Invoice number", invoice: "Invoice",
    backToList: "Back to orders", items: "Service details", service: "Service", qty: "Quantity",
    unitPrice: "Unit price", subtotal: "Subtotal", discount: "Discount", payments: "Payment history",
    method: "Method", amount: "Amount", receivedBy: "Received by", summary: "Payment summary", settled: "Paid",
    pickupDate: "Pickup date", note: "Note", advanceStatus: "Advance status", reverseStatus: "Reverse status",
    statusAdvanced: "Order status updated.", statusReversed: "Order status reversed.", receivePayment: "Receive payment",
    voided: "Order voided", voidedBy: "Voided by",
    paymentSaved: "Payment saved. Balance is now",
    // Override messages
    balanceRemainsError: "This order still has a remaining balance. Only a manager can force Completed status.",
    managerRequiredError: "Only a manager can override the remaining balance.",
    overrideTitle: "Override Completed",
    overrideMessage: "This order still has a remaining balance of",
    overrideMessage2: "Only a manager can force Completed status with a note.",
    overrideNoteLabel: "Override note (required)",
    overrideNotePlaceholder: "Enter reason for forcing completion...",
    overrideNoteRequired: "Override note is required.",
    overrideConfirm: "Confirm override",
    voidOrder: "Void order",
    voidTitle: "Void order",
    voidWarning: "The order will be voided and its journal entries reversed. Cash to return to the customer:",
    voidReasonLabel: "Void reason (required)",
    voidReasonPlaceholder: "Enter the void reason...",
    voidConfirm: "Confirm void",
    voidedSuccess: "Order voided and journal entries reversed.",
    alreadyVoided: "This order is already voided.",
  },
  counterBoard: {
    activeOrders: "Active orders",
    readyOrders: "Ready for pickup",
    leftToPay: "Left to pay",
    emptyColumn: "No orders in this status.",
  },
  receivables: {
    totalOwed: "Total receivables",
    days: "days",
    empty: "No orders have an outstanding balance.",
  },
  expenses: {
    title: "Expenses",
    lead: "Manage operational expenses.",
    add: "Add expense",
    addTitle: "New expense",
    category: "Category",
    amount: "Amount",
    paidFrom: "Paid from",
    date: "Date",
    note: "Note",
    notePlaceholder: "Optional note...",
    savedCreate: "Expense added.",
    empty: "No expenses yet.",
    listTitle: "Expense list",
    createdBy: "Created by",
    reversedTitle: "Reversed",
    reversed: "Reversed",
    reverse: "Reverse",
    reverseReasonPlaceholder: "Reverse reason...",
    reverseReasonRequired: "Reverse reason is required (5-200 characters).",
    saved: "Expense saved.",
  },
  stock: {
    title: "Supplies stock",
    lead: "Manage supplies, purchases, and usage.",
    addSupply: "Add supply",
    addPurchase: "Record purchase",
    addUsage: "Record usage",
    newSupply: "New supply",
    newPurchase: "Supply purchase",
    newUsage: "Supply usage",
    usageSaved: "Supply usage saved.",
    supply: "Supply",
    name: "Name",
    unit: "Unit",
    quantity: "Quantity",
    totalCost: "Total cost",
    minQty: "Minimum level",
    minStock: "Min",
    stock: "Stock",
    avgCost: "Average cost",
    date: "Date",
    note: "Note",
    paidFrom: "Paid from",
    lowStock: "Low stock:",
    selectSupply: "Select supply",
    noSupplies: "No supplies yet.",
    noMovements: "No movements yet.",
    movements: "Movement history",
    suppliesList: "Supply list",
    in: "In",
    out: "Out",
    purchaseSaved: "Supply purchase saved.",
    supplySaved: "Supply added.",
    createdBy: "Created by",
    type: "Type",
  },
  reports: {
    title: "Reports",
    lead: "Choose a report to see the numbers and a plain-language summary.",
    incomeStatement: "Income statement",
    cashFlow: "Cash flow",
    balanceSheet: "Balance sheet",
    sales: "Sales",
    ledger: "Ledger",
    trialBalance: "Trial balance",
    from: "From",
    to: "To",
    asOf: "As of",
    account: "Account",
    apply: "Apply",
    print: "Print",
    export: "Export CSV",
    period: "Period",
    today: "Today",
    thisWeek: "This week",
    thisMonth: "This month",
    custom: "Custom",
    revenue: "Revenue",
    expenses: "Expenses",
    profit: "Profit",
    cashIn: "Cash in",
    cashOut: "Cash out",
    netCash: "Net cash movement",
    openingCash: "Opening cash",
    closingCash: "Closing cash",
    assets: "Assets",
    equity: "Equity",
    balanced: "Assets equal equity.",
    notBalanced: "Assets do not equal equity. Check the journal.",
    code: "Code",
    accountName: "Account name",
    debit: "Debit",
    credit: "Credit",
    balance: "Balance",
    total: "Total",
    service: "Service",
    quantity: "Quantity",
    day: "Day",
    date: "Date",
    orders: "Orders",
    noData: "No data in this period.",
    summaryIncome: "Revenue minus expenses gives profit of",
    summaryCash: "Opening cash plus net movement gives closing cash of",
    summaryBalance: "Total assets and equity on this date are",
    summarySales: "Total sales in this period are",
    summaryLedger: "Account movement in this period",
    summaryTrial: "Total debits and credits must be equal.",
    orderPayments: "Order payments",
    other: "Other",
  },
  dashboard: {
    title: "Dashboard",
    earnedToday: "Earned today",
    receivedToday: "Received today",
    toCollect: "Still to collect",
    lowStock: "Low stock",
    readyOrders: "Ready for pickup",
    last7Days: "Revenue for the last 7 days",
    noLowStock: "All stock levels are safe.",
    noReady: "No orders ready for pickup.",
    noCollect: "No open balances.",
    viewAll: "View all",
    chartLabel: "Revenue chart for the last seven days",
  },
  audit: {
    title: "Audit log",
    lead: "History of user actions in the app.",
    user: "User",
    action: "Action",
    entity: "Entity",
    date: "Date",
    from: "From",
    to: "To",
    filter: "Apply",
    clear: "Clear filters",
    empty: "No audit records yet.",
    allUsers: "All users",
    allActions: "All actions",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { id, en };

export function getDictionary(locale: Locale = "id"): Dictionary {
  return dictionaries[locale];
}

/** Schemas currently use the Indonesian catalog; the UI locale is applied later. */
export const validation: ValidationMessages = dictionaries.id.validation;
