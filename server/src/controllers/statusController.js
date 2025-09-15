exports.status = async (req, res) => {
  try {
    return res.json({ status: "ok", timestamp: new Date().toISOString(), service: "Courier Management API" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
