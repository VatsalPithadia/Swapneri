import { Request, Response } from 'express';
import { ordersService } from '../services/orders.service';

export const ordersController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status, customerId, priority, search } = req.query;
      const data = await ordersService.getAll({
        status: status as any,
        customerId: customerId as string,
        priority: priority as string,
        search: search as string,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const data = await ordersService.getById(req.params.id as string);
      if (!data) return res.status(404).json({ success: false, error: 'Order not found' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await ordersService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, notes } = req.body;
      const data = await ordersService.updateStatus(req.params.id as string, status, notes);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await ordersService.delete(req.params.id as string);
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const data = await ordersService.getDashboardStats();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
