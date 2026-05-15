import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', getSettings);
router.get('/status', (req, res, next) => {
  import('../controllers/settingsController.js').then(ctrl => ctrl.getStoreStatus(req, res)).catch(next);
});
router.patch('/', updateSettings);

export default router;
