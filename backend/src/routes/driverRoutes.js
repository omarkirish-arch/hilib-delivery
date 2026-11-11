import express from 'express';
import {
  toggleAvailability,
  getActiveDeliveries,
  updateDeliveryStatus,
  verifyDeliveryOTP,
  getDriverEarningsAndHistory,
} from '../controllers/driverController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes réservées au rôle DRIVER (ou ADMIN pour supervision)
router.use(protect);
router.use(restrictTo('DRIVER', 'ADMIN'));

router.put('/availability', toggleAvailability);
router.get('/active-deliveries', getActiveDeliveries);
router.put('/orders/:orderId/status', updateDeliveryStatus);
router.post('/orders/:orderId/verify-otp', verifyDeliveryOTP);
router.get('/earnings', getDriverEarningsAndHistory);

export default router;

