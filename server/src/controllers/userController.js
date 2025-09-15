"use strict";

module.exports = {
  async handshake(req, res) {
    try {
      return res.json({ scope: "users", message: "Users API is reachable" });
    } catch (err) {
      return res.status(500).json({ message: err.message, code: "USER_HANDSHAKE_ERROR" });
    }
  },
};
