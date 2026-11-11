import { Router } from 'express';
import { customersController } from '../controllers/customers.controller';

const router = Router();

router.get('/', customersController.getAll);
router.get('/:id', customersController.getById);
router.post('/', customersController.create);
router.put('/:id', customersController.update);
router.delete('/:id', customersController.delete);

export default router;

