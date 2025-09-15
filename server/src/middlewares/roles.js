"use strict";

module.exports.hasRole = function hasRole(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          message: "Unauthorized: user is not authenticated",
          code: "UNAUTHORIZED",
        });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Forbidden: insufficient role",
          code: "FORBIDDEN",
        });
      }
      return next();
    } catch (err) {
      return res.status(500).json({
        message: err.message || "Roles middleware error",
        code: "ROLES_MIDDLEWARE_ERROR",
      });
    }
  };
};
