"use strict";
const mongoose = require("mongoose");

const CourierSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ["foot", "bike", "car", "scooter"],
      required: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Courier", CourierSchema);
