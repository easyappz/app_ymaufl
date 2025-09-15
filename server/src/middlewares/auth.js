"use strict";
const jwt = require("jsonwebtoken");
const { JWT_SECRET, NODE_ENV } = require("@src/config/constants");

module.exports = function auth(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"]; 
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization header is missing or invalid",
        code: "AUTH_HEADER_MISSING",
      });
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.userId, role: payload.role };
      return next();
    } catch (err) {
      return res.status(401).json({
        message: err.message || "Invalid or expired token",
        code: "TOKEN_INVALID",
        stack: NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Auth middleware error",
      code: "AUTH_MIDDLEWARE_ERROR",
      stack: NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};
