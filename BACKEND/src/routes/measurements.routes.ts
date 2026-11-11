import { Router } from 'express';
import { measurementsController } from '../controllers/measurements.controller';

const router = Router();

router.get('/customer/:customerId', measurementsController.getByCustomerId);
router.get('/:id', measurementsController.getById);
router.post('/', measurementsController.save);
router.delete('/:id', measurementsController.delete);

export default router;

