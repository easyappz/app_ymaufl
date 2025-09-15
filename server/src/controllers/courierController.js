"use strict";

module.exports = {
  async handshake(req, res) {
    try {
      return res.json({ scope: "couriers", message: "Couriers API is reachable" });
    } catch (err) {
      return res.status(500).json({ message: err.message, code: "COURIER_HANDSHAKE_ERROR" });
    }
  },
};
