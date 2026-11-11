import { Request, Response } from 'express';
import { customersService } from '../services/customers.service';

export const customersController = {
  async getAll(req: Request, res: Response) {
    try {
      const data = await customersService.getAll();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const data = await customersService.getById(req.params.id as string);
      if (!data) return res.status(404).json({ success: false, error: 'Customer not found' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await customersService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await customersService.update(req.params.id as string, req.body);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await customersService.delete(req.params.id as string);
      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
