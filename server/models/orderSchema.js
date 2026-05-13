import mongoose from "mongoose";
<<<<<<< HEAD
=======
import { getIO, emitOrderStatusUpdate } from "../socket.js";
>>>>>>> develop

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  orderType: {
    type: String,
<<<<<<< HEAD
    // Standardized to kebab-case, removed redundancies
=======
>>>>>>> develop
    enum: ["dine-in", "takeaway", "delivery"],
    required: true
  },
  orderSource: {
    type: String,
    enum: ["admin", "waiter", "user"],
    required: true
  },

<<<<<<< HEAD
  // Linked Entities (Bidirectional compatibility)
=======
  // Linked Entities
>>>>>>> develop
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Team app compatibility
  table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  sessionId: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },

  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
    name: String,
    size: String,
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: {
      type: Number,
      min: 0,
      required: function () { return !this.price; }
    },
<<<<<<< HEAD
=======
    costPrice: {
      type: Number,
      default: 0,
      min: 0
    },
>>>>>>> develop
    price: Number, // Team app compatibility
    totalPrice: {
      type: Number,
      min: 0,
      required: function () { return !this.price; }
    },
    kitchenStatus: {
      type: String,
      enum: ["placed", "preparing", "ready", "delayed"],
      default: "placed"
    }
  }],

<<<<<<< HEAD
  // Customer & Delivery Info (Bidirectional sync)
=======
  // Customer & Delivery Info
>>>>>>> develop
  customerDetails: {
    name: { type: String, default: "Walk-in" },
    phone: String,
    address: String,
    location: mongoose.Schema.Types.Mixed,
<<<<<<< HEAD
    numberOfGuests: { type: Number, default: 1 },
=======
>>>>>>> develop
    remarks: String
  },
  address: {
    recipientName: String,
    mobile: String,
    address: String,
    type: { type: String },
    location: String
  },

  // Financials
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
<<<<<<< HEAD
  deliveryFee: { type: Number, default: 0 }, // Added from snippet
=======
  deliveryFee: { type: Number, default: 0 },
>>>>>>> develop
  totalAmount: { type: Number, default: 0 },
  cashReceived: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },

  // Status Management
  orderStatus: {
    type: String,
    enum: ["placed", "processing", "out-for-delivery", "delivered", "cancelled"],
    default: "placed"
  },
<<<<<<< HEAD

=======
>>>>>>> develop
  kitchenStatus: {
    type: String,
    enum: ["placed", "preparing", "ready", "delayed"],
    default: "placed"
  },
<<<<<<< HEAD

  remarks: { type: String, trim: true }, // Added for easy top-level access
  isLocked: { type: Boolean, default: false },
=======
>>>>>>> develop
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
<<<<<<< HEAD
    enum: ["cash", "upi", "card", "online", "cod"]
  }
=======
    enum: ["cash", "upi", "card", "online", "cod", "wallet"]
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  remarks: { type: String, trim: true },
  isLocked: { type: Boolean, default: false },
>>>>>>> develop
}, { timestamps: true, strict: true });

// Pre-validation hook: Data Consistency & Calculations
orderSchema.pre('validate', async function () {
<<<<<<< HEAD
  // 1. Financial Calculations (Including Delivery Fee)
=======
  // 1. Financial Calculations
>>>>>>> develop
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount') || this.isModified('deliveryFee')) {
    this.subtotal = this.items.reduce((acc, item) =>
      acc + (item.totalPrice || (item.price * item.quantity) || 0), 0
    );
<<<<<<< HEAD
    // Formula: Subtotal + Tax + DeliveryFee - Discount
=======
>>>>>>> develop
    this.totalAmount = Math.max(0, this.subtotal + (this.tax || 0) + (this.deliveryFee || 0) - (this.discount || 0));
  }

  // 2. Cash Balance Calculation
  if (this.paymentMethod === 'cash' || this.paymentMethod === 'cod') {
    this.balance = (this.cashReceived || 0) - this.totalAmount;
  }

  // 3. Payment Status Auto-Update
<<<<<<< HEAD
  if (this.paymentMethod === 'online') {
    this.paymentStatus = 'paid';
=======
  if (this.paymentMethod === 'wallet') {
    if (this.paymentStatus === 'pending') {
      this.paymentStatus = 'paid';
    }
>>>>>>> develop
  }

  // 4. Kitchen Status Aggregation
  if (this.items && this.items.length > 0) {
    const statuses = this.items.map(i => i.kitchenStatus);
    if (statuses.some(s => s === "delayed")) {
      this.kitchenStatus = "delayed";
    } else if (statuses.every(s => s === "ready")) {
      this.kitchenStatus = "ready";
    } else if (statuses.some(s => s === "preparing" || s === "ready")) {
      this.kitchenStatus = "preparing";
    } else {
      this.kitchenStatus = "placed";
    }

    if (this.kitchenStatus !== "placed") this.isLocked = true;
  }

  // 5. Address/Customer Sync
  if (this.isModified('customerDetails') && !this.isModified('address')) {
    this.address = {
      ...this.address,
      recipientName: this.customerDetails?.name || "Walk-in",
      mobile: this.customerDetails?.phone || "",
      address: this.customerDetails?.address || "",
      location: typeof this.customerDetails?.location === 'object' ?
        `📍 Maps: https://www.google.com/maps?q=${this.customerDetails.location.lat},${this.customerDetails.location.lng}` :
        (this.customerDetails?.location || "")
    };
  }
});

<<<<<<< HEAD
// Added Socket Notification from snippet
orderSchema.post('save', async function (doc) {
  try {
    // Using dynamic import for ESM compatibility and to avoid circular dependencies
    const { getIO } = await import('../socket.js');
    if (doc._id) {
      getIO().emit('ordersUpdated');
    }
  } catch (err) {
    // Silent catch if socket isn't ready
  }
});

export default mongoose.model("Order", orderSchema);
=======
// Post-save hook for real-time notifications
orderSchema.post('save', function (doc) {
  try {
    if (doc._id) {
      // General update for all listeners
      getIO().emit('ordersUpdated');

      // Specific status update for tracking
      if (doc.orderStatus) {
        emitOrderStatusUpdate(doc._id.toString(), doc.orderStatus);
      }
    }
  } catch (err) {
    console.error("Socket error in orderSchema post-save:", err);
  }
});

export default mongoose.model("Order", orderSchema);
>>>>>>> develop
