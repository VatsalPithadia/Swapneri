import { Request, Response } from 'express';
import { paymentsService } from '../services/payments.service';

export const paymentsController = {
  async getAll(req: Request, res: Response) {
    try {
      const data = await paymentsService.getAll();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async record(req: Request, res: Response) {
    try {
      const data = await paymentsService.record(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },
};

