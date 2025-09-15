exports.handshake = async (req, res) => {
  try {
    return res.json({ scope: "orders", message: "Orders API is reachable" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
