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
  note: string;
  items: string;
  quantity: string;
  date: string;
  paymentType: string;
  paymentMethod: string;
  depositAmount: string;
  laterPayment: string;
  paymentTooMuch: string;
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

export type Dictionary = {
  validation: ValidationMessages;
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
    note: "Catatan maksimal 200 karakter.",
    items: "Tambahkan minimal satu layanan, maksimal 20 baris.",
    quantity: "Jumlah harus antara 0,01 dan 999,99.",
    date: "Tanggal tidak valid.",
    paymentType: "Jenis pembayaran tidak valid.",
    paymentMethod: "Metode pembayaran tidak valid.",
    depositAmount: "Uang muka harus lebih dari 0.",
    laterPayment: "Pembayaran belakangan tidak boleh menyertakan jumlah.",
    paymentTooMuch: "Jumlah pembayaran melebihi sisa tagihan.",
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
    note: "Note must be at most 200 characters.",
    items: "Add at least one service line, up to 20 lines.",
    quantity: "Quantity must be between 0.01 and 999.99.",
    date: "Invalid date.",
    paymentType: "Invalid payment type.",
    paymentMethod: "Invalid payment method.",
    depositAmount: "Deposit must be greater than 0.",
    laterPayment: "Pay later cannot include an amount.",
    paymentTooMuch: "Payment exceeds the remaining balance.",
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
};

export const dictionaries: Record<Locale, Dictionary> = { id, en };

export function getDictionary(locale: Locale = "id"): Dictionary {
  return dictionaries[locale];
}

/** Schemas currently use the Indonesian catalog; the UI locale is applied later. */
export const validation: ValidationMessages = dictionaries.id.validation;
