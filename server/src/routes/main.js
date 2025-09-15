const express = require("express");

const authController = require("@src/controllers/authController");
const courierController = require("@src/controllers/courierController");
const orderController = require("@src/controllers/orderController");
const userController = require("@src/controllers/userController");
const statusController = require("@src/controllers/statusController");
const authMiddleware = require("@src/middlewares/auth");

const router = express.Router();

// Service status
router.get("/status", statusController.status);

// Auth endpoints
router.get("/auth", authController.handshake); // optional handshake
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);

// Namespace handshakes for other domains
router.get("/couriers", courierController.handshake);
router.get("/orders", orderController.handshake);
router.get("/users", userController.handshake);

module.exports = router;
