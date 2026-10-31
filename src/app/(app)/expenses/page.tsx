import { requireRole } from "@/server/auth";
import { getExpenses, getExpenseBalance } from "@/server/actions/expenses";
import { ExpensesManager } from "@/components/expenses/expenses-manager";

export default async function ExpensesPage() {
  await requireRole("MANAGER");
  
  const [expenses, balances] = await Promise.all([
    getExpenses(),
    getExpenseBalance(),
  ]);

  return (
    <ExpensesManager
      expenses={expenses}
      cashBalance={balances.cashBalance}
      bankBalance={balances.bankBalance}
    />
  );
}