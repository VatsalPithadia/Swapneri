// ==============================================================================
// lib/services/expenses.service.ts
// Expenses Data Access Layer
// ==============================================================================

import { Expense } from '../shared/types/database';
import { ExpenseFormData } from '../shared/validation/expense.schema';
import { demoStore } from './demo-store';
import { supabase } from '../supabase/client';

function isLiveSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder.supabase.co'));
}

export const expensesService = {
  async getAll(): Promise<Expense[]> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data || [];
    }
    return demoStore.getExpenses();
  },

  async create(data: ExpenseFormData): Promise<Expense> {
    if (isLiveSupabase()) {
      const { data: created, error } = await supabase
        .from('expenses')
        .insert({
          category: data.category,
          amount: data.amount,
          expense_date: data.expense_date,
          paid_to: data.paid_to || null,
          payment_mode: data.payment_mode || 'cash',
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    }
    return demoStore.addExpense(data);
  },
};
