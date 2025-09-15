const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    pickupAddress: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "assigned", "picked_up", "delivered", "cancelled"],
      default: "new"
    },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: "Courier", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
