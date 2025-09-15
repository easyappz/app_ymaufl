const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, index: true, sparse: true },
    phone: { type: String, index: true, unique: true, sparse: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'dispatcher', 'courier', 'customer'], default: 'courier', index: true },
    passwordHash: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
