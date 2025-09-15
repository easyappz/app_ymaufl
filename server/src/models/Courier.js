const mongoose = require("mongoose");

const CourierSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    phone: { type: String, default: "" },
    vehicleType: { type: String, enum: ["bike", "car", "foot", "scooter"], default: "foot" },
    active: { type: Boolean, default: true },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Courier", CourierSchema);
