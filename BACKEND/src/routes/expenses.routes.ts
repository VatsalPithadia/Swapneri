import { Router } from 'express';
import { expensesController } from '../controllers/expenses.controller';

const router = Router();

router.get('/', expensesController.getAll);
router.post('/', expensesController.record);
router.delete('/:id', expensesController.delete);

export default router;

