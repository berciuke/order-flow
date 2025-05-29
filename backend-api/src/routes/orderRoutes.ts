import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById
} from '../controllers/orderController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();


router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);

export default router; 