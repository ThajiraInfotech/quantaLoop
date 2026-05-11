const { AppError } = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/jwt");

function authenticate({ jwtSecret }) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    const bearer =
      header && header.startsWith("Bearer ") ? header.slice(7) : null;
    const cookieToken = req.cookies?.ql_at;
    const token = bearer || cookieToken;

    if (!token) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }

    try {
      const payload = verifyAccessToken(token, jwtSecret);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch {
      next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
    }
  };
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Forbidden", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
}

module.exports = { authenticate, authorize };
