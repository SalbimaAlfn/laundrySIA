"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatRupiah } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { createExpenseAction, reverseExpenseAction, type ExpenseRecord } from "@/server/actions/expenses";
import styles from "./expenses-manager.module.css";

const categories = [
  { key: "ELECTRICITY_WATER", label: "Listrik & Air" },
  { key: "WAGES", label: "Gaji" },
  { key: "RENT", label: "Sewa" },
  { key: "OTHER", label: "Lainnya" },
] as const;

const paidFromOptions = [
  { key: "CASH", label: "Tunai" },
  { key: "BANK", label: "Bank" },
] as const;

interface ExpensesManagerProps {
  expenses: ExpenseRecord[];
  cashBalance: number;
  bankBalance: number;
}

export function ExpensesManager({ expenses: initialExpenses, cashBalance, bankBalance }: ExpensesManagerProps) {
  const t = getDictionary();
  const { show } = useToast();
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reverseId, setReverseId] = useState<number | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [formData, setFormData] = useState({
    category: "ELECTRICITY_WATER",
    amount: "",
    paidFrom: "CASH",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [formError, setFormError] = useState<Record<string, string>>({});

  // Sync expenses when router.refresh() updates the page
  const initialExpensesJson = JSON.stringify(initialExpenses);
  useEffect(() => {
    setExpenses(initialExpenses);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [initialExpensesJson]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError[name]) {
      setFormError(prev => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError({});
    
    const form = new FormData();
    form.append("category", formData.category);
    form.append("amount", formData.amount);
    form.append("paidFrom", formData.paidFrom);
    form.append("date", formData.date);
    if (formData.note) form.append("note", formData.note);

    startTransition(async () => {
      const result = await createExpenseAction({ status: "idle" }, form);
      if (result.status === "success") {
        show(t.expenses?.savedCreate || "Pengeluaran ditambahkan.");
        setShowForm(false);
        setFormData({
          category: "ELECTRICITY_WATER",
          amount: "",
          paidFrom: "CASH",
          date: new Date().toISOString().slice(0, 10),
          note: "",
        });
        router.refresh();
      } else if (result.status === "invalid" && result.errors) {
        setFormError(result.errors);
      } else {
        show(t.common.genericError);
      }
    });
  }

  async function handleReverse(id: number) {
    if (!reverseReason.trim() || reverseReason.length < 5) {
      show(t.expenses?.reverseReasonRequired || "Alasan pembatalan wajib diisi (5-200 karakter).");
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.append("id", String(id));
      form.append("reason", reverseReason);
      
      const result = await reverseExpenseAction(form);
      if (result.ok) {
        show(t.expenses?.reversed || "Pengeluaran dibatalkan.");
        setReverseId(null);
        setReverseReason("");
        router.refresh();
      } else {
        show(result.error || t.common.genericError);
      }
    });
  }

  const activeExpenses = expenses.filter(e => !e.reversedAt);
  const reversedExpenses = expenses.filter(e => e.reversedAt);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t.expenses?.title || "Pengeluaran"}</h1>
          <p className={styles.caption}>{t.expenses?.lead || "Kelola pengeluaran operasional."}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={showForm}>
          <Plus aria-hidden="true" size={16} /> {t.expenses?.add || "Tambah pengeluaran"}
        </Button>
      </header>

      {/* Balance Cards */}
      <div className={styles.balanceCards}>
        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Saldo Tunai</span>
          <span className={styles.balanceValue}>{formatRupiah(cashBalance)}</span>
        </div>
        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Saldo Bank</span>
          <span className={styles.balanceValue}>{formatRupiah(bankBalance)}</span>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.formTitle}>{t.expenses?.addTitle || "Pengeluaran baru"}</h2>
          
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>{t.expenses?.category || "Kategori"} *</span>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={formError.category ? styles.error : ""}
              >
                {categories.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              {formError.category && <span className={styles.errorText}>{formError.category}</span>}
            </label>

            <label className={styles.field}>
              <span>{t.expenses?.amount || "Jumlah"} *</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0"
                min="1"
                className={formError.amount ? styles.error : ""}
              />
              {formError.amount && <span className={styles.errorText}>{formError.amount}</span>}
            </label>

            <label className={styles.field}>
              <span>{t.expenses?.paidFrom || "Dibayar dari"} *</span>
              <select name="paidFrom" value={formData.paidFrom} onChange={handleInputChange}>
                {paidFromOptions.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>{t.expenses?.date || "Tanggal"} *</span>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={formError.date ? styles.error : ""}
              />
              {formError.date && <span className={styles.errorText}>{formError.date}</span>}
            </label>
          </div>

          <label className={styles.fieldFull}>
            <span>{t.expenses?.note || "Catatan"}</span>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              rows={2}
              maxLength={200}
              placeholder={t.expenses?.notePlaceholder || "Catatan opsional..."}
            />
          </label>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={pending}>
              {t.common.save}
            </Button>
          </div>
        </form>
      )}

      {/* Expenses List */}
      <div className={styles.list}>
        <h2 className={styles.listTitle}>{t.expenses?.listTitle || "Daftar pengeluaran"}</h2>
        
        {activeExpenses.length === 0 && reversedExpenses.length === 0 ? (
          <p className={styles.empty}>{t.expenses?.empty || "Belum ada pengeluaran."}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.expenses?.date || "Tanggal"}</th>
                <th>{t.expenses?.category || "Kategori"}</th>
                <th className={styles.right}>{t.expenses?.amount || "Jumlah"}</th>
                <th>{t.expenses?.paidFrom || "Dari"}</th>
                <th>{t.expenses?.createdBy || "Dibuat oleh"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.date}</td>
                  <td>{categories.find(c => c.key === expense.category)?.label || expense.category}</td>
                  <td className={styles.right}>{formatRupiah(expense.amount)}</td>
                  <td>{paidFromOptions.find(p => p.key === expense.paidFrom)?.label || expense.paidFrom}</td>
                  <td>{expense.createdBy}</td>
                  <td>
                    <div className={styles.actions}>
                      {reverseId === expense.id ? (
                        <div className={styles.reverseForm}>
                          <input
                            type="text"
                            value={reverseReason}
                            onChange={(e) => setReverseReason(e.target.value)}
                            placeholder={t.expenses?.reverseReasonPlaceholder || "Alasan pembatalan..."}
                            maxLength={200}
                            className={styles.reverseInput}
                          />
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleReverse(expense.id)}
                            disabled={pending}
                          >
                            <RefreshCw aria-hidden="true" size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="text"
                            onClick={() => { setReverseId(null); setReverseReason(""); }}
                          >
                            {t.common.cancel}
                          </Button>
                        </div>
                      ) : (
                        <button
                          className={styles.reverseButton}
                          onClick={() => setReverseId(expense.id)}
                          title={t.expenses?.reverse || "Batalkan"}
                        >
                          <RotateCcw aria-hidden="true" size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reversedExpenses.length > 0 && (
                <>
                  <tr className={styles.separatorRow}>
                    <td colSpan={6}>{t.expenses?.reversedTitle || "Dibatalkan"}</td>
                  </tr>
                  {reversedExpenses.map(expense => (
                    <tr key={expense.id} className={styles.reversedRow}>
                      <td>{expense.date}</td>
                      <td>{categories.find(c => c.key === expense.category)?.label || expense.category}</td>
                      <td className={styles.right}><del>{formatRupiah(expense.amount)}</del></td>
                      <td>{paidFromOptions.find(p => p.key === expense.paidFrom)?.label || expense.paidFrom}</td>
                      <td>{expense.createdBy}</td>
                      <td className={styles.reversedBadge}>
                        <Trash2 aria-hidden="true" size={14} /> {t.expenses?.reversed || "Dibatalkan"}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}