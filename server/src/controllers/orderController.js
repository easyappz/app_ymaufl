"use strict";

module.exports = {
  async handshake(req, res) {
    try {
      return res.json({ scope: "orders", message: "Orders API is reachable" });
    } catch (err) {
      return res.status(500).json({ message: err.message, code: "ORDER_HANDSHAKE_ERROR" });
    }
  },
};
