import { Router } from 'express';
import { ordersController } from '../controllers/orders.controller';

const router = Router();

router.get('/stats', ordersController.getStats);
router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);
router.post('/', ordersController.create);
router.patch('/:id/status', ordersController.updateStatus);
router.delete('/:id', ordersController.delete);

export default router;

