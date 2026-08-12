const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  sandwich: { type: String, required: true, trim: true, maxlength: 200 },
  supplements: { type: [String], default: [] },
  dessert: { type: String, default: '' },
  drink: { type: String, default: '' },
  commune: { type: String, required: true, trim: true, maxlength: 120 },
  deliveryFee: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['جديد','مقبول','مرفوض','مكتمل','ملغى','قيد التحضير','قيد التوصيل'], default: 'جديد' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
