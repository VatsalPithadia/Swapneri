import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';

const router = Router();

router.get('/', paymentsController.getAll);
router.post('/', paymentsController.record);

export default router;

