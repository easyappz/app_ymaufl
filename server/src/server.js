"use strict";
require("module-alias/register");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const apiRoutes = require("@src/routes/main");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Base info route
app.get("/", (req, res) => {
  res.json({ service: "Courier Management API", status: "ok", basePath: "/api" });
});

// API routes
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error", details: err.details || null });
});

// MongoDB connection and server start
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[server] Connected to MongoDB");
  } catch (err) {
    console.error("[server] MongoDB connection error:", err.message);
  } finally {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`[server] Listening on http://localhost:${PORT}`);
    });
  }
})();
