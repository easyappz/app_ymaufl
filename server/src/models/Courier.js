const mongoose = require('mongoose');

const CourierSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    city: { type: String, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    vehicleType: { type: String, enum: ['car', 'bike', 'foot', 'scooter', 'other'], default: 'other' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Courier', CourierSchema);
