import { z } from "zod";
import { validation } from "@/lib/i18n";
import {
  businessDaySchema,
  optionalNoteSchema,
  paymentSourceSchema,
  positiveMoneySchema,
} from "./common";

export const expenseCategorySchema = z.enum(["ELECTRICITY_WATER", "WAGES", "RENT", "OTHER"], {
  error: validation.category,
});

export const expenseSchema = z.object({
  category: expenseCategorySchema,
  amount: positiveMoneySchema,
  paidFrom: paymentSourceSchema,
  date: businessDaySchema,
  note: optionalNoteSchema,
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
