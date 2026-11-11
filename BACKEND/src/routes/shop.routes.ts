import { Router } from 'express';
import { shopController } from '../controllers/shop.controller';

const router = Router();

router.get('/', shopController.getShop);
router.put('/', shopController.updateShop);
router.get('/garments', shopController.getGarments);
router.patch('/garments/:code/price', shopController.updatePrice);

export default router;

