import { Router } from 'express';
import { dataController } from '../controllers/dataController';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { createDataSchema, updateDataSchema, filterSchema, idSchema } from '../utils/validation';

const router = Router();

router.post(
  '/',
  validateBody(createDataSchema),
  dataController.create.bind(dataController)
);

router.get(
  '/',
  validateQuery(filterSchema),
  dataController.findAll.bind(dataController)
);

router.get(
  '/summary',
  validateQuery(filterSchema),
  dataController.getSummary.bind(dataController)
);

router.get(
  '/by-category',
  validateQuery(filterSchema),
  dataController.getByCategory.bind(dataController)
);

router.get(
  '/timeline',
  validateQuery(filterSchema),
  dataController.getTimeline.bind(dataController)
);

router.get(
  '/:id',
  validateParams(idSchema),
  dataController.findById.bind(dataController)
);

router.put(
  '/:id',
  validateParams(idSchema),
  validateBody(updateDataSchema),
  dataController.update.bind(dataController)
);

router.delete(
  '/:id',
  validateParams(idSchema),
  dataController.delete.bind(dataController)
);

export default router;

