import { Router } from 'express';
import { investmentController } from '../controllers/investmentController';

const router = Router();

router.post('/', investmentController.create);
router.get('/', investmentController.findAll);
router.get('/by-asset-type', investmentController.getByAssetType);
router.get('/:id', investmentController.findById);
router.put('/:id', investmentController.update);
router.delete('/:id', investmentController.delete);

export default router;