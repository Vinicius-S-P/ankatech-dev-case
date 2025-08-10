import { Router } from 'express';
import { allocationController } from '../controllers/allocationController';

const router = Router();

router.post('/', allocationController.create);
router.get('/current', allocationController.getCurrent);
router.get('/history', allocationController.getHistory);
router.put('/:id', allocationController.update);
router.delete('/:id', allocationController.delete);

export default router;