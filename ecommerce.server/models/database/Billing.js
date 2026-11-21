const mongoose = require('mongoose');

const BillingItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const BillingSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    orderNumber: {
      type: String,
      default: '',
    },
    customer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
    },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'USA' },
    },
    items: [BillingItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 13, // 13% VAT standard
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'stripe', 'paypal', 'cash_on_delivery', 'bank_transfer', 'esewa', 'khalti'],
      default: 'credit_card',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'unpaid', 'overdue', 'refunded'],
      default: 'paid',
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

BillingSchema.index({ 'customer.email': 1, createdAt: -1 });
BillingSchema.index({ paymentStatus: 1 });
BillingSchema.index({ orderNumber: 1 });

const Billing = mongoose.models.Billing || mongoose.model('Billing', BillingSchema);

module.exports = { Billing, BillingSchema };
