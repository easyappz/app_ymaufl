const express = require("express");

const authController = require("@src/controllers/authController");
const courierController = require("@src/controllers/courierController");
const orderController = require("@src/controllers/orderController");
const userController = require("@src/controllers/userController");
const statusController = require("@src/controllers/statusController");

const router = express.Router();

// Namespaced routers
const authRouter = express.Router();
authRouter.get("/", authController.handshake);

const couriersRouter = express.Router();
couriersRouter.get("/", courierController.handshake);

const ordersRouter = express.Router();
ordersRouter.get("/", orderController.handshake);

const usersRouter = express.Router();
usersRouter.get("/", userController.handshake);

// Service status
router.get("/status", statusController.status);

// Mount namespaces
router.use("/auth", authRouter);
router.use("/couriers", couriersRouter);
router.use("/orders", ordersRouter);
router.use("/users", usersRouter);

module.exports = router;
