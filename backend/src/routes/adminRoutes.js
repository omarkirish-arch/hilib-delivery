import express from 'express';
import {
  assignDriverToOrder,
  autoAssignDriver,
  getAdminDashboardMetrics,
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Toutes les routes admin sont protégées et réservées aux utilisateurs avec le rôle ADMIN
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/dashboard', getAdminDashboardMetrics);
router.post('/orders/:orderId/assign-driver', assignDriverToOrder);
router.post('/orders/:orderId/auto-assign', autoAssignDriver);

export default router;

