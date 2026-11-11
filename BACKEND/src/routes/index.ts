import { Router } from 'express';
import customersRoutes from './customers.routes';
import ordersRoutes from './orders.routes';
import paymentsRoutes from './payments.routes';
import expensesRoutes from './expenses.routes';
import measurementsRoutes from './measurements.routes';
import shopRoutes from './shop.routes';

const router = Router();

router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/expenses', expensesRoutes);
router.use('/measurements', measurementsRoutes);
router.use('/shop', shopRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Swapneri Boutique API', timestamp: new Date().toISOString() });
});

export default router;

