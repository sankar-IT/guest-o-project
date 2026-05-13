import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User Routes
router.post('/place', protect, orderController.placeOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.put('/:id/cancel', protect, orderController.cancelOrder);

// Admin & Waiter Routes
router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder); // New table order
router.post('/counter', orderController.createCounterOrder);
router.get('/table/:tableId', orderController.getOrdersByTable);
router.get('/waiter/stats', orderController.getWaiterStats);
router.get('/:orderId', orderController.getOrderById);

router.patch('/:id', orderController.updateOrder);
router.patch('/:orderId/status', orderController.updateOrderStatus);
router.patch('/:orderId/payment-status', orderController.updatePaymentStatus);

// Item Management
router.patch('/:id/add-items', orderController.addItems);
router.patch('/:id/items', orderController.updateOrderItems);
router.patch('/:orderId/items/:itemId/remove', orderController.removeItem);
router.patch('/:orderId/items/:itemId/status', orderController.updateItemStatus);
router.patch('/:orderId/items/:itemId/quantity', orderController.updateItemQuantity);

// Cleanup & Finalization
router.delete('/clear-history', orderController.clearHistory);
router.delete('/:orderId', orderController.deleteTableOrder);

export default router;
