import Table from '../models/tableSchema.js';
import Order from '../models/orderSchema.js';

/**
 * @desc Get all tables
 * @route GET /api/tables
 */
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find({}, 'tableNumber status capacity occupiedSeats');
    
    // Add availableSeats calculation
    const tablesWithAvailable = tables.map(t => {
      const tableObj = t.toObject();
      tableObj.availableSeats = Math.max(0, (t.capacity || 0) - (t.occupiedSeats || 0));
      return tableObj;
    });

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tablesWithAvailable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get table by ID with all active orders
export const getTableDetails = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Fetch ALL active orders for this table (not just one)
    const activeOrders = await Order.find({ 
      table: tableId, 
      orderStatus: { $in: ['placed', 'processing', 'out-for-delivery'] },
      paymentStatus: 'pending' 
    }).populate('items.menuItem').sort({ createdAt: -1 });

    const tableObj = table.toObject();
    tableObj.availableSeats = Math.max(0, (table.capacity || 0) - (table.occupiedSeats || 0));

    res.status(200).json({
      success: true,
      data: {
        table: tableObj,
        activeOrders: activeOrders || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Create a new table
export const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required'
      });
    }

    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }

    const table = await Table.create({
      tableNumber,
      capacity: capacity || 4
    });

    res.status(201).json({
      success: true,
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete a table
export const deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if there are active orders for this table
    const activeOrdersCount = await Order.countDocuments({
      table: tableId,
      orderStatus: { $in: ['placed', 'processing'] },
      paymentStatus: 'pending'
    });

    if (activeOrdersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete table with active orders. Please clear orders first.'
      });
    }

    await Table.findByIdAndDelete(tableId);

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
