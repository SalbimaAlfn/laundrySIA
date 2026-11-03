"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, AlertTriangle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { createSupplyAction, createSupplyPurchaseAction, createSupplyUsageAction, type SupplyRecord, type SupplyMovementRecord } from "@/server/actions/supply";
import styles from "./stock-manager.module.css";

const paidFromOptions = [
  { key: "CASH", label: "Tunai" },
  { key: "BANK", label: "Bank" },
] as const;

interface StockManagerProps {
  supplies: SupplyRecord[];
  movements: SupplyMovementRecord[];
}

export function StockManager({ supplies: initialSupplies, movements: initialMovements }: StockManagerProps) {
  const t = getDictionary();
  const { show } = useToast();
  const router = useRouter();
  const supplies = initialSupplies;
  const movements = initialMovements;
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const [purchaseForm, setPurchaseForm] = useState({
    supplyId: "",
    quantity: "",
    totalCost: "",
    paidFrom: "CASH",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [purchaseError, setPurchaseError] = useState<Record<string, string>>({});

  const [supplyForm, setSupplyForm] = useState({
    name: "",
    unit: "",
    minQty: "",
  });
  const [supplyError, setSupplyError] = useState<Record<string, string>>({});

  const [usageForm, setUsageForm] = useState({
    supplyId: "",
    quantity: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [usageError, setUsageError] = useState<Record<string, string>>({});

  function handlePurchaseInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setPurchaseForm(prev => ({ ...prev, [name]: value }));
    if (purchaseError[name]) {
      setPurchaseError(prev => ({ ...prev, [name]: "" }));
    }
  }

  function handleSupplyInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setSupplyForm(prev => ({ ...prev, [name]: value }));
    if (supplyError[name]) {
      setSupplyError(prev => ({ ...prev, [name]: "" }));
    }
  }

  async function handlePurchaseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPurchaseError({});

    const form = new FormData();
    form.append("supplyId", purchaseForm.supplyId);
    form.append("quantity", String(Math.round(Number(purchaseForm.quantity) * 100)));
    form.append("totalCost", purchaseForm.totalCost);
    form.append("paidFrom", purchaseForm.paidFrom);
    form.append("date", purchaseForm.date);
    if (purchaseForm.note) form.append("note", purchaseForm.note);

    startTransition(async () => {
      const result = await createSupplyPurchaseAction({ status: "idle" }, form);
      if (result.status === "success") {
        show(t.stock?.purchaseSaved || "Pembelian supplies disimpan.");
        setShowPurchaseForm(false);
        setPurchaseForm({
          supplyId: "",
          quantity: "",
          totalCost: "",
          paidFrom: "CASH",
          date: new Date().toISOString().slice(0, 10),
          note: "",
        });
        router.refresh();
      } else if (result.status === "invalid" && result.errors) {
        setPurchaseError(result.errors);
      } else {
        show(t.common.genericError);
      }
    });
  }

  async function handleSupplySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSupplyError({});

    const form = new FormData();
    form.append("name", supplyForm.name);
    form.append("unit", supplyForm.unit);
    form.append("minQty", supplyForm.minQty);

    startTransition(async () => {
      const result = await createSupplyAction({ status: "idle" }, form);
      if (result.status === "success") {
        show(t.stock?.supplySaved || "Supply ditambahkan.");
        setShowSupplyForm(false);
        setSupplyForm({ name: "", unit: "", minQty: "" });
        router.refresh();
      } else if (result.status === "invalid" && result.errors) {
        setSupplyError(result.errors);
      } else {
        show(t.common.genericError);
      }
    });
  }

  function handleUsageInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setUsageForm(prev => ({ ...prev, [name]: value }));
    if (usageError[name]) setUsageError(prev => ({ ...prev, [name]: "" }));
  }

  async function handleUsageSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsageError({});
    const form = new FormData();
    form.append("supplyId", usageForm.supplyId);
    form.append("quantity", String(Math.round(Number(usageForm.quantity) * 100)));
    form.append("date", usageForm.date);
    if (usageForm.note) form.append("note", usageForm.note);

    startTransition(async () => {
      const result = await createSupplyUsageAction({ status: "idle" }, form);
      if (result.status === "success") {
        show(t.stock?.usageSaved);
        setShowUsageForm(false);
        setUsageForm({ supplyId: "", quantity: "", date: new Date().toISOString().slice(0, 10), note: "" });
        router.refresh();
      } else if (result.status === "invalid" && result.errors) {
        setUsageError(result.errors);
      } else {
        show(t.common.genericError);
      }
    });
  }

  const lowStockSupplies = supplies.filter(s => s.stockQty <= s.minQty);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t.stock?.title || "Stok Supplies"}</h1>
          <p className={styles.caption}>{t.stock?.lead || "Kelola supplies dan pembelian."}</p>
        </div>
        <div className={styles.headerButtons}>
          <Button onClick={() => setShowSupplyForm(!showSupplyForm)} variant="secondary" disabled={showSupplyForm}>
            <Package aria-hidden="true" size={16} /> {t.stock?.addSupply || "Tambah supply"}
          </Button>
          <Button onClick={() => setShowPurchaseForm(!showPurchaseForm)} disabled={showPurchaseForm}>
            <Plus aria-hidden="true" size={16} /> {t.stock?.addPurchase || "Catat pembelian"}
          </Button>
          <Button variant="secondary" onClick={() => setShowUsageForm(!showUsageForm)} disabled={showUsageForm}>
            <Minus aria-hidden="true" size={16} /> {t.stock?.addUsage}
          </Button>
        </div>
      </header>

      {/* Low Stock Alert */}
      {lowStockSupplies.length > 0 && (
        <div className={styles.lowStockAlert}>
          <AlertTriangle aria-hidden="true" size={18} />
          <span>{t.stock?.lowStock || "Stok rendah:"} {lowStockSupplies.map(s => s.name).join(", ")}</span>
        </div>
      )}

      {/* Add Supply Form */}
      {showSupplyForm && (
        <form onSubmit={handleSupplySubmit} className={styles.form}>
          <h2 className={styles.formTitle}>{t.stock?.newSupply || "Supply baru"}</h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>{t.stock?.name || "Nama"} *</span>
              <input
                type="text"
                name="name"
                value={supplyForm.name}
                onChange={handleSupplyInputChange}
                placeholder="Detergen"
                maxLength={80}
                className={supplyError.name ? styles.error : ""}
              />
              {supplyError.name && <span className={styles.errorText}>{supplyError.name}</span>}
            </label>
            <label className={styles.field}>
              <span>{t.stock?.unit || "Satuan"} *</span>
              <input
                type="text"
                name="unit"
                value={supplyForm.unit}
                onChange={handleSupplyInputChange}
                placeholder="Liter"
                maxLength={20}
                className={supplyError.unit ? styles.error : ""}
              />
              {supplyError.unit && <span className={styles.errorText}>{supplyError.unit}</span>}
            </label>
            <label className={styles.field}>
              <span>{t.stock?.minQty || "Batas minimum"}</span>
              <input
                type="number"
                name="minQty"
                value={supplyForm.minQty}
                onChange={handleSupplyInputChange}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setShowSupplyForm(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={pending}>
              {t.common.save}
            </Button>
          </div>
        </form>
      )}

      {/* Purchase Form */}
      {showPurchaseForm && (
        <form onSubmit={handlePurchaseSubmit} className={styles.form}>
          <h2 className={styles.formTitle}>{t.stock?.newPurchase || "Pembelian supplies"}</h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>{t.stock?.supply || "Supply"} *</span>
              <select
                name="supplyId"
                value={purchaseForm.supplyId}
                onChange={handlePurchaseInputChange}
                className={purchaseError.supplyId ? styles.error : ""}
              >
                <option value="">-- {t.stock?.selectSupply || "Pilih supply"} --</option>
                {supplies.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                ))}
              </select>
              {purchaseError.supplyId && <span className={styles.errorText}>{purchaseError.supplyId}</span>}
            </label>
            <label className={styles.field}>
              <span>{t.stock?.quantity || "Jumlah"} *</span>
              <input
                type="number"
                name="quantity"
                value={purchaseForm.quantity}
                onChange={handlePurchaseInputChange}
                placeholder="0"
                min="0.01"
                step="0.01"
                className={purchaseError.quantity ? styles.error : ""}
              />
              {purchaseError.quantity && <span className={styles.errorText}>{purchaseError.quantity}</span>}
            </label>
            <label className={styles.field}>
              <span>{t.stock?.totalCost || "Total biaya"} *</span>
              <input
                type="number"
                name="totalCost"
                value={purchaseForm.totalCost}
                onChange={handlePurchaseInputChange}
                placeholder="0"
                min="1"
                className={purchaseError.totalCost ? styles.error : ""}
              />
              {purchaseError.totalCost && <span className={styles.errorText}>{purchaseError.totalCost}</span>}
            </label>
            <label className={styles.field}>
              <span>{t.stock?.paidFrom || "Dibayar dari"} *</span>
              <select name="paidFrom" value={purchaseForm.paidFrom} onChange={handlePurchaseInputChange}>
                {paidFromOptions.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t.stock?.date || "Tanggal"} *</span>
              <input
                type="date"
                name="date"
                value={purchaseForm.date}
                onChange={handlePurchaseInputChange}
                className={purchaseError.date ? styles.error : ""}
              />
              {purchaseError.date && <span className={styles.errorText}>{purchaseError.date}</span>}
            </label>
          </div>
          <label className={styles.fieldFull}>
            <span>{t.stock?.note || "Catatan"}</span>
            <textarea
              name="note"
              value={purchaseForm.note}
              onChange={handlePurchaseInputChange}
              rows={2}
              maxLength={200}
            />
          </label>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setShowPurchaseForm(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={pending}>
              {t.common.save}
            </Button>
          </div>
        </form>
      )}

      {/* Usage Form */}
      {showUsageForm && (
        <form onSubmit={handleUsageSubmit} className={styles.form}>
          <h2 className={styles.formTitle}>{t.stock?.newUsage}</h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>{t.stock?.supply} *</span>
              <select
                name="supplyId"
                value={usageForm.supplyId}
                onChange={handleUsageInputChange}
                className={usageError.supplyId ? styles.error : ""}
              >
                <option value="">-- {t.stock?.selectSupply} --</option>
                {supplies.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.stockQty.toFixed(2)} {s.unit})</option>
                ))}
              </select>
              {usageError.supplyId && <span className={styles.errorText}>{usageError.supplyId}</span>}
            </label>
            <label className={styles.field}>
              <span>{t.stock?.quantity} *</span>
              <input
                type="number"
                name="quantity"
                value={usageForm.quantity}
                onChange={handleUsageInputChange}
                placeholder="0"
                min="0.01"
                step="0.01"
                className={usageError.quantity ? styles.error : ""}
              />
              {usageError.quantity && <span className={styles.errorText}>{usageError.quantity}</span>}
            </label>
            <label className={styles.field}>
              <span>{t.stock?.date} *</span>
              <input
                type="date"
                name="date"
                value={usageForm.date}
                onChange={handleUsageInputChange}
                className={usageError.date ? styles.error : ""}
              />
              {usageError.date && <span className={styles.errorText}>{usageError.date}</span>}
            </label>
          </div>
          <label className={styles.fieldFull}>
            <span>{t.stock?.note}</span>
            <textarea name="note" value={usageForm.note} onChange={handleUsageInputChange} rows={2} maxLength={200} />
          </label>
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setShowUsageForm(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={pending}>{t.common.save}</Button>
          </div>
        </form>
      )}

      {/* Supplies List */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.stock?.suppliesList || "Daftar supplies"}</h2>
        {supplies.length === 0 ? (
          <p className={styles.empty}>{t.stock?.noSupplies || "Belum ada supply."}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.stock?.name || "Nama"}</th>
                <th>{t.stock?.unit || "Satuan"}</th>
                <th className={styles.right}>{t.stock?.stock || "Stok"}</th>
                <th className={styles.right}>{t.stock?.minStock || "Min"}</th>
                <th className={styles.right}>{t.stock?.avgCost || "Harga rata-rata"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {supplies.map(supply => (
                <tr key={supply.id} className={supply.stockQty <= supply.minQty ? styles.lowStock : ""}>
                  <td>{supply.name}</td>
                  <td>{supply.unit}</td>
                  <td className={styles.right}>{supply.stockQty.toFixed(2)}</td>
                  <td className={styles.right}>{supply.minQty.toFixed(2)}</td>
                  <td className={styles.right}>{formatRupiah(supply.avgUnitCost)}</td>
                  <td>
                    {supply.stockQty <= supply.minQty && (
                      <span className={styles.lowStockBadge}>
                        <AlertTriangle aria-hidden="true" size={14} /> Rendah
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Movements List */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.stock?.movements || "Riwayat movements"}</h2>
        {movements.length === 0 ? (
          <p className={styles.empty}>{t.stock?.noMovements || "Belum ada riwayat."}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.stock?.date || "Tanggal"}</th>
                <th>{t.stock?.supply || "Supply"}</th>
                <th>{t.stock?.type || "Jenis"}</th>
                <th className={styles.right}>{t.stock?.quantity || "Jumlah"}</th>
                <th className={styles.right}>{t.stock?.totalCost || "Total"}</th>
                <th>{t.stock?.createdBy || "Dibuat oleh"}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{m.supplyName}</td>
                  <td>
                    <span className={m.type === "IN" ? styles.inBadge : styles.outBadge}>
                      {m.type === "IN" ? t.stock?.in : t.stock?.out}
                    </span>
                  </td>
                  <td className={styles.right}>{m.quantity.toFixed(2)}</td>
                  <td className={styles.right}>{formatRupiah(m.totalCost)}</td>
                  <td>{m.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}