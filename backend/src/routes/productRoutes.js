import express from 'express';
import { getProducts, createProduct } from '../controllers/productController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', protect, restrictTo('ADMIN'), createProduct);

export default router;

