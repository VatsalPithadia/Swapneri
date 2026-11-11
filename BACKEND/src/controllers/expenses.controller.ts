import { Request, Response } from 'express';
import { expensesService } from '../services/expenses.service';

export const expensesController = {
  async getAll(req: Request, res: Response) {
    try {
      const { category } = req.query;
      const data = await expensesService.getAll({ category: category as string });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async record(req: Request, res: Response) {
    try {
      const data = await expensesService.record(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await expensesService.delete(req.params.id as string);
      res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
