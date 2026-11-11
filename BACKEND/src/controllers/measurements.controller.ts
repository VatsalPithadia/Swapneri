import { Request, Response } from 'express';
import { measurementsService } from '../services/measurements.service';

export const measurementsController = {
  async getByCustomerId(req: Request, res: Response) {
    try {
      const data = await measurementsService.getByCustomerId(req.params.customerId as string);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const data = await measurementsService.getById(req.params.id as string);
      if (!data) return res.status(404).json({ success: false, error: 'Measurement profile not found' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async save(req: Request, res: Response) {
    try {
      const { profile, values } = req.body;
      const data = await measurementsService.saveProfile(profile, values || []);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await measurementsService.deleteProfile(req.params.id as string);
      res.json({ success: true, message: 'Measurement profile deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
