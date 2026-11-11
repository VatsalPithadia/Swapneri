import { Request, Response } from 'express';
import { shopService } from '../services/shop.service';

export const shopController = {
  async getShop(req: Request, res: Response) {
    try {
      const data = await shopService.getShop();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateShop(req: Request, res: Response) {
    try {
      const data = await shopService.updateShop(req.body);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  async getGarments(req: Request, res: Response) {
    try {
      const data = await shopService.getGarmentTypes();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updatePrice(req: Request, res: Response) {
    try {
      const code = req.params.code as string;
      const { price } = req.body;
      await shopService.updateGarmentPrice(code, Number(price));
      res.json({ success: true, message: 'Price updated successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  },
};
