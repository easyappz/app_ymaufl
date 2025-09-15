exports.handshake = async (req, res) => {
  try {
    return res.json({ scope: "users", message: "Users API is reachable" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
