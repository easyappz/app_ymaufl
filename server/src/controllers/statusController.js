"use strict";
const { NODE_ENV } = require("@src/config/constants");

module.exports = {
  status(req, res) {
    try {
      return res.json({
        service: "Courier Management API",
        status: "ok",
        timestamp: new Date().toISOString(),
        env: NODE_ENV,
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message,
        code: "STATUS_ERROR",
      });
    }
  },
};
