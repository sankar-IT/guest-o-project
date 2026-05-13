import Order from '../models/orderSchema.js';
import Counter from '../models/counterSchema.js';
import Menu from '../models/menuSchema.js';
import Size from '../models/sizeSchema.js';
import Table from '../models/tableSchema.js';
import { getIO } from '../socket.js';

const getNextOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: 'orderNumber' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return `ORD-${counter.seq.toString().padStart(4, '0')}`;
};

const restoreStock = async (items) => {
  for (const item of items) {
    try {
      const sizeDoc = await Size.findOne({ name: item.size });
      const multiplier = sizeDoc ? sizeDoc.value : 1;
      const restoreAmount = item.quantity * multiplier;

      await Menu.findByIdAndUpdate(item.menuItem, {
        $inc: { totalStock: restoreAmount }
      });
    } catch (error) {
      console.error(`Error restoring stock for item ${item.menuItem}:`, error);
    }
  }
};

class OrderController {
  async createCounterOrder(req, res) {
    try {
      const { customerDetails, items, orderType, paymentMethod, subtotal, tax, discount, totalAmount, cashReceived, balance } = req.body;

      const orderNumber = await getNextOrderNumber();

      // Auto-set payment status for cash
      let paymentStatus = 'pending';
      if (paymentMethod === 'cash' && cashReceived >= totalAmount) {
        paymentStatus = 'paid';
      }

      const newOrder = new Order({
        orderNumber,
        orderType: orderType || 'takeaway',
        orderSource: 'admin',
        orderStatus: 'placed',
        customerDetails: {
          name: customerDetails?.name || 'Walk-in',
          phone: customerDetails?.phone,
          address: customerDetails?.address,
          location: customerDetails?.location,
        },
        items: items.map(item => ({
          ...item,
          kitchenStatus: 'placed'
        })),
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentMethod,
        cashReceived: cashReceived || 0,
        balance: balance || 0,
        paymentStatus,
        orderStatus: 'placed'
      });

      await newOrder.save();

      // Reduce Stock
      for (const item of items) {
        const sizeDoc = await Size.findOne({ name: item.size });
        const multiplier = sizeDoc ? sizeDoc.value : 1;
        const reductionAmount = item.quantity * multiplier;

        await Menu.findByIdAndUpdate(item.menuItem, {
          $inc: { totalStock: -reductionAmount }
        });
      }

      res.status(201).json({ success: true, data: newOrder });
      getIO().emit('ordersUpdated');
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const { type } = req.query;
      const query = type ? { orderType: type } : {};
      const orders = await Order.find(query).sort({ createdAt: -1 });
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      // Handle Stock recovery and reduction if items are changed
      if (updateData.items) {
        await restoreStock(order.items);

        for (const item of updateData.items) {
          const sizeDoc = await Size.findOne({ name: item.size });
          const multiplier = sizeDoc ? sizeDoc.value : 1;
          const reductionAmount = item.quantity * multiplier;

          await Menu.findByIdAndUpdate(item.menuItem, {
            $inc: { totalStock: -reductionAmount }
          });
        }
      }

      // Handle Stock Recovery if cancelled
      if (updateData.orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
        await restoreStock(order.items);
      }

      // Recalculate totals on server for consistency
      if (updateData.items) {
        const subtotal = updateData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        updateData.subtotal = subtotal;
        updateData.tax = 0;
        updateData.totalAmount = subtotal;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: 'after' }
      ).populate('items.menuItem').populate('table');

      getIO().emit('ordersUpdated');
      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      // Restore stock if not already cancelled
      if (order.status !== 'cancelled') {
        await restoreStock(order.items);
      }

      await Order.findByIdAndDelete(id);
      getIO().emit('ordersUpdated');
      res.json({ success: true, message: 'Order deleted and stock restored' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateItemStatus(req, res) {
    try {
      const { orderId, itemId } = req.params;
      const { kitchenStatus } = req.body;

      // Validate kitchenStatus value
      const allowedStatuses = ['pending', 'preparing', 'delayed', 'ready'];
      if (!allowedStatuses.includes(kitchenStatus)) {
        return res.status(400).json({ success: false, message: `Invalid kitchen status: "${kitchenStatus}"` });
      }

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const item = order.items.id(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      item.kitchenStatus = kitchenStatus;
      await order.save();

      // Emit socket event for real-time update
      getIO().emit('ordersUpdated');

      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Update item status error:', error);
      // Log to a file for debugging
      import('fs').then(fs => {
        fs.appendFileSync('error.log', `${new Date().toISOString()} - ${error.stack}\n`);
      });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (order.isLocked) {
        return res.status(403).json({ success: false, message: 'Order is locked and cannot be edited' });
      }

      order.items.push(...items.map(item => ({ ...item, kitchenStatus: 'placed' })));

      // Recalculate Totals
      const newSubtotal = order.items.reduce((acc, item) => acc + item.totalPrice, 0);
      order.subtotal = newSubtotal;
      order.tax = 0;
      order.totalAmount = newSubtotal - (order.discount || 0);

      // Update cash details if provided or recalculate
      if (req.body.cashReceived !== undefined) {
        order.cashReceived = req.body.cashReceived;
      }

      if (order.paymentMethod === 'cash') {
        order.balance = (order.cashReceived || 0) - order.totalAmount;
      }

      await order.save();

      // Reduce Stock for new items
      for (const item of items) {
        const sizeDoc = await Size.findOne({ name: item.size });
        const multiplier = sizeDoc ? sizeDoc.value : 1;
        const reductionAmount = item.quantity * multiplier;

        await Menu.findByIdAndUpdate(item.menuItem, {
          $inc: { totalStock: -reductionAmount }
        });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeItem(req, res) {
    try {
      const { orderId, itemId } = req.params;

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (order.isLocked) {
        return res.status(403).json({ success: false, message: 'Order is locked and cannot be edited' });
      }

      const item = order.items.id(itemId);
      if (item) {
        // Restore Stock
        const sizeDoc = await Size.findOne({ name: item.size });
        const multiplier = sizeDoc ? sizeDoc.value : 1;
        const restoreAmount = item.quantity * multiplier;

        await Menu.findByIdAndUpdate(item.menuItem, {
          $inc: { totalStock: restoreAmount }
        });

        order.items.pull(itemId);

        // Recalculate Totals
        const newSubtotal = order.items.reduce((acc, item) => acc + item.totalPrice, 0);
        order.subtotal = newSubtotal;
        order.totalAmount = newSubtotal + (order.tax || 0) - (order.discount || 0);

        // Recalculate Balance if it's a cash payment
        if (order.paymentMethod === 'cash' && order.cashReceived > 0) {
          order.balance = order.cashReceived - order.totalAmount;
        }

        await order.save();
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- New Table Ordering Controllers ---

  /**
   * @desc Create a new order for a table
   */
  async createOrder(req, res) {
    try {
      const { tableId, items, orderSource, customerCount } = req.body;
      const guests = Number(customerCount) || 1;

      // Check table availability
      const table = await Table.findById(tableId);
      if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

      const availableSeats = Math.max(0, table.capacity - table.occupiedSeats);
      if (guests > availableSeats) {
        return res.status(400).json({
          success: false,
          message: `Insufficient seats. Only ${availableSeats} seats available, but requested ${guests}.`
        });
      }

      // Recalculate totals on server for consistency
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = 0;
      const totalAmount = subtotal;

      const orderNumber = await getNextOrderNumber();

      const newOrder = new Order({
        orderNumber,
        orderType: 'dine-in',
        orderSource: orderSource || 'waiter',
        table: tableId,
        sessionId: `SESS-${Date.now()}`,
        items,
        subtotal,
        tax,
        totalAmount,
        orderStatus: 'placed',
        remarks: req.body.remarks || '',
        customerDetails: {
          name: req.body.customerDetails?.name || 'Walk-in',
          phone: req.body.customerDetails?.phone || '',
          numberOfGuests: guests,
          remarks: req.body.remarks || ''
        }
      });

      await newOrder.save();

      // Reduce Stock
      for (const item of items) {
        try {
          const sizeDoc = await Size.findOne({ name: item.size });
          const multiplier = sizeDoc ? sizeDoc.value : 1;
          const reductionAmount = item.quantity * multiplier;

          await Menu.findByIdAndUpdate(item.menuItem, {
            $inc: { totalStock: -reductionAmount }
          });
        } catch (stockError) {
          console.error(`Error reducing stock for item ${item.menuItem}:`, stockError);
        }
      }

      // Update table occupancy
      const newOccupied = table.occupiedSeats + guests;
      let status = 'partial';
      if (newOccupied >= table.capacity) status = 'full';
      if (newOccupied === 0) status = 'empty';

      await Table.findByIdAndUpdate(tableId, {
        occupiedSeats: newOccupied,
        status: status
      });

      getIO().emit('ordersUpdated');
      res.status(201).json({ success: true, data: newOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @desc Get all items ordered for a specific table
   */
  async getOrdersByTable(req, res) {
    try {
      const { tableId } = req.params;

      // Fetch all orders for this table, sorted by latest first
      const orders = await Order.find({ table: tableId })
        .populate('items.menuItem')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        tableId,
        count: orders.length,
        orders: orders
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @desc Update status of an order
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: status },
        { new: true, runValidators: true }
      );

      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      getIO().emit('ordersUpdated');
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @desc Update payment status
   */
  async updatePaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { paymentStatus } = req.body;

      const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus },
        { new: true, runValidators: true }
      );

      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @desc Delete/Complete order and free up table
   */
  async deleteTableOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);

      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const tableId = order.table;
      const guestsToFree = order.customerDetails?.numberOfGuests || 0;

      await Order.findByIdAndDelete(orderId);

      // Update table occupancy by subtracting only the guests from this order
      if (tableId) {
        const table = await Table.findById(tableId);
        if (table) {
          const newOccupied = Math.max(0, table.occupiedSeats - guestsToFree);
          let status = 'empty';
          if (newOccupied > 0 && newOccupied < table.capacity) status = 'partial';
          if (newOccupied >= table.capacity) status = 'full';

          await Table.findByIdAndUpdate(tableId, {
            status: status,
            occupiedSeats: newOccupied
          });
        }
      }

      getIO().emit('ordersUpdated');
      res.status(200).json({ success: true, message: 'Order completed and table freed' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId)
        .populate('items.menuItem')
        .populate('table')
        .populate('createdBy', 'name role');

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @desc Get real-time stats for Waiter Dashboard
   */
  async getWaiterStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [activeTablesCount, placedOrdersCount, todaysSalesData] = await Promise.all([
        Table.countDocuments({ status: { $in: ['partial', 'full'] } }),
        Order.countDocuments({ 
          orderStatus: 'placed',
          createdAt: { $gte: today } 
        }),
        Order.aggregate([
          { 
            $match: { 
              createdAt: { $gte: today },
              orderStatus: { $ne: 'cancelled' }
            } 
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      ]);

      res.status(200).json({
        success: true,
        data: {
          activeTables: activeTablesCount,
          placedOrders: placedOrdersCount,
          todaysSales: todaysSalesData.length > 0 ? todaysSalesData[0].total : 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new OrderController();
