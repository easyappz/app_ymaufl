const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, index: true },
    customerPhone: { type: String, required: true },
    addressFrom: { type: String, required: true },
    addressTo: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['new', 'assigned', 'picked_up', 'delivered', 'canceled'],
      default: 'new',
      index: true,
    },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: 'Courier', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
