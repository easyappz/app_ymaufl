exports.handshake = async (req, res) => {
  try {
    return res.json({ scope: "auth", message: "Auth API is reachable" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
