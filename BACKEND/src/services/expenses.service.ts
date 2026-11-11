import { supabase } from '../config/supabase';
import { Expense } from '../shared/types/database';
import { ExpenseFormData } from '../shared/validation/expense.schema';

export const expensesService = {
  async getAll(filters?: { category?: string }): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async record(data: ExpenseFormData): Promise<Expense> {
    const { data: newExp, error } = await supabase
      .from('expenses')
      .insert({
        category: data.category,
        amount: data.amount,
        expense_date: data.expense_date,
        payment_mode: data.payment_mode,
        paid_to: data.paid_to || null,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return newExp;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

