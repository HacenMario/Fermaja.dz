const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  sandwich: { type: String, required: true },
  supplements: { type: [String], default: [] },
  dessert: { type: String, default: '' },
  drink: { type: String, default: '' },
  commune: { type: String, required: true },
  deliveryFee: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'جديد' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
