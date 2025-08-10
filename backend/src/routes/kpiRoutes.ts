import { Router } from 'express';
import { kpiController } from '../controllers/kpiController';

const router = Router();

router.post('/', kpiController.create);
router.get('/', kpiController.findAll);
router.get('/grouped', kpiController.getByGroup);
router.get('/:id', kpiController.findById);
router.put('/:id', kpiController.update);
router.delete('/:id', kpiController.delete);

export default router;