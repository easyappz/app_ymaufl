"use strict";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("@src/models/User");
const Courier = require("@src/models/Courier");
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require("@src/config/constants");

function signToken(user) {
  return jwt.sign({ userId: user._id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

module.exports = {
  // Optional: keep handshake for namespace visibility
  async handshake(req, res) {
    try {
      return res.json({ scope: "auth", message: "Auth API is reachable" });
    } catch (err) {
      return res.status(500).json({
        message: err.message,
        code: "AUTH_HANDSHAKE_ERROR",
        stack: NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  },

  async register(req, res) {
    try {
      const { email, password, role = "dispatcher", fullName = "", phone = "", courier } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
          code: "VALIDATION_ERROR",
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({
          message: "User with this email already exists",
          code: "EMAIL_TAKEN",
        });
      }

      const passwordHash = await bcrypt.hash(String(password), 10);

      const user = await User.create({
        email: normalizedEmail,
        passwordHash,
        role,
        fullName,
        phone,
        isActive: true,
      });

      let courierProfile = null;
      if (role === "courier" && courier) {
        const { vehicleType, city = "", rating = 0, isAvailable = true, currentLocation } = courier;
        courierProfile = await Courier.create({
          user: user._id,
          vehicleType,
          city,
          rating,
          isAvailable,
          currentLocation,
        });
      }

      const token = signToken(user);
      return res.status(201).json({ user: user.toJSON(), courier: courierProfile ? courierProfile.toJSON() : null, token });
    } catch (err) {
      // Handle duplicate key error explicitly if it occurs during create
      if (err && err.code === 11000) {
        return res.status(409).json({
          message: "Duplicate key error: email or user already exists",
          code: "DUPLICATE_KEY",
          stack: NODE_ENV === "development" ? err.stack : undefined,
        });
      }
      return res.status(500).json({
        message: err.message || "Registration error",
        code: "AUTH_REGISTER_ERROR",
        stack: NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
          code: "VALIDATION_ERROR",
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      const isMatch = await bcrypt.compare(String(password), user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message: "User is deactivated",
          code: "USER_INACTIVE",
        });
      }

      const token = signToken(user);
      return res.json({ user: user.toJSON(), token });
    } catch (err) {
      return res.status(500).json({
        message: err.message || "Login error",
        code: "AUTH_LOGIN_ERROR",
        stack: NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  },

  async me(req, res) {
    try {
      const userId = req.user && req.user.id;
      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const userDoc = await User.findById(userId);
      if (!userDoc) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      let courierProfile = null;
      if (userDoc.role === "courier") {
        courierProfile = await Courier.findOne({ user: userDoc._id });
      }

      return res.json({ user: userDoc.toJSON(), courier: courierProfile ? courierProfile.toJSON() : null });
    } catch (err) {
      return res.status(500).json({
        message: err.message || "Profile error",
        code: "AUTH_ME_ERROR",
        stack: NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  },
};
