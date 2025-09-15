module.exports = (...roles) => {
  return (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role) {
        return res.status(403).json({ error: 'Forbidden', details: 'Missing user role in request context' });
      }
      if (!roles.includes(role)) {
        return res.status(403).json({ error: 'Forbidden', details: `Requires one of roles: ${roles.join(', ')}` });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Role check failed', details: err.message });
    }
  };
};
