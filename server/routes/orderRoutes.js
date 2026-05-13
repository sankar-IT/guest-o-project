import express from 'express';
import orderController from '../controllers/orderController.js';

const router = express.Router();

router.post('/counter', orderController.createCounterOrder);
router.post('/', orderController.createOrder); // New table order
router.get('/', orderController.getOrders);
router.get('/table/:tableId', orderController.getOrdersByTable); // New
router.patch('/:id', orderController.updateOrder);
router.patch('/:orderId/status', orderController.updateOrderStatus);
router.patch('/:orderId/payment-status', orderController.updatePaymentStatus); // New
router.patch('/:id/add-items', orderController.addItems);
router.patch('/:orderId/items/:itemId/remove', orderController.removeItem);
router.patch('/:orderId/items/:itemId/status', orderController.updateItemStatus);
router.get('/waiter/stats', orderController.getWaiterStats);
router.get('/:orderId', orderController.getOrderById);
router.delete('/:orderId', orderController.deleteTableOrder); // New

export default router;
