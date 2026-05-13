import mongoose from "mongoose";
import { getIO, emitOrderStatusUpdate } from "../socket.js";

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  orderType: {
    type: String,
    enum: ["dine-in", "takeaway", "delivery"],
    required: true
  },
  orderSource: {
    type: String,
    enum: ["admin", "waiter", "user"],
    required: true
  },

  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
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
    costPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    price: Number, 
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

  customerDetails: {
    name: { type: String, default: "Walk-in" },
    phone: String,
    address: String,
    location: mongoose.Schema.Types.Mixed,
    numberOfGuests: { type: Number, default: 1 },
    remarks: String
  },
  address: {
    recipientName: String,
    mobile: String,
    address: String,
    type: { type: String },
    location: String
  },

  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  cashReceived: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },

  orderStatus: {
    type: String,
    enum: ["placed", "processing", "out-for-delivery", "delivered", "cancelled"],
    default: "placed"
  },
  kitchenStatus: {
    type: String,
    enum: ["placed", "preparing", "ready", "delayed"],
    default: "placed"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "upi", "card", "online", "cod", "wallet"]
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  remarks: { type: String, trim: true },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true, strict: true });

orderSchema.pre('validate', async function () {
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount') || this.isModified('deliveryFee')) {
    this.subtotal = this.items.reduce((acc, item) =>
      acc + (item.totalPrice || (item.price * item.quantity) || 0), 0
    );
    this.totalAmount = Math.max(0, this.subtotal + (this.tax || 0) + (this.deliveryFee || 0) - (this.discount || 0));
  }

  if (this.paymentMethod === 'cash' || this.paymentMethod === 'cod') {
    this.balance = (this.cashReceived || 0) - this.totalAmount;
  }

  if (this.paymentMethod === 'wallet' || this.paymentMethod === 'online') {
    if (this.paymentStatus === 'pending') {
      this.paymentStatus = 'paid';
    }
  }

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

orderSchema.post('save', function (doc) {
  try {
    if (doc._id) {
      getIO().emit('ordersUpdated');

      if (doc.orderStatus) {
        emitOrderStatusUpdate(doc._id.toString(), doc.orderStatus);
      }
    }
  } catch (err) {
    console.error("Socket error in orderSchema post-save:", err);
  }
});

export default mongoose.model("Order", orderSchema);
