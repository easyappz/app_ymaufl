const jwt = require("jsonwebtoken");

// In this iteration we keep a simple dev secret; later move to a config constant if needed.
const JWT_SECRET = "dev-secret";

exports.verifyAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Authorization token is required" });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id || payload.sub || null, role: payload.role || null };
    return next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};
