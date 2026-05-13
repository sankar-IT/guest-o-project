import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

<<<<<<< HEAD
router.post('/counter', orderController.createCounterOrder);
router.post('/', orderController.createOrder); // New table order
router.get('/', orderController.getOrders);
router.get('/table/:tableId', orderController.getOrdersByTable); // New
router.patch('/:id', orderController.updateOrder);
router.patch('/:orderId/status', orderController.updateOrderStatus);
router.patch('/:orderId/payment-status', orderController.updatePaymentStatus); // New
=======
// User Routes
router.post('/', protect, orderController.placeOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.put('/:id/cancel', protect, orderController.cancelOrder);

// Shared / Admin Routes
router.get('/', orderController.getOrders);
router.put('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/status', orderController.updateOrderStatus);

// Counter / Item Management (from develop)
router.post('/counter', orderController.createCounterOrder);
>>>>>>> develop
router.patch('/:id/add-items', orderController.addItems);
router.patch('/:id/items', orderController.updateOrderItems);
router.patch('/:orderId/items/:itemId/remove', orderController.removeItem);
router.patch('/:orderId/items/:itemId/status', orderController.updateItemStatus);
<<<<<<< HEAD
router.get('/waiter/stats', orderController.getWaiterStats);
router.get('/:orderId', orderController.getOrderById);
router.delete('/:orderId', orderController.deleteTableOrder); // New
=======
router.patch('/:orderId/items/:itemId/quantity', orderController.updateItemQuantity);
router.delete('/clear-history', orderController.clearHistory);
>>>>>>> develop

export default router;
