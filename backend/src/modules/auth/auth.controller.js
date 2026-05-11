const { asyncHandler } = require("../../utils/asyncHandler");
const { AppError } = require("../../utils/AppError");
const {
  registerBodySchema,
  loginBodySchema,
  parseBody,
} = require("../../validations/auth.validation");
const { registerUser, loginUser } = require("./auth.service");

const ACCESS_COOKIE = "ql_at";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res, token, isProduction) {
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

function clearAuthCookie(res, isProduction) {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

function createAuthController(env) {
  const jwtSecret = env.JWT_SECRET;
  const jwtExpiresIn = env.JWT_EXPIRES_IN;
  const isProduction = env.NODE_ENV === "production";

  const register = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(registerBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const { user, accessToken } = await registerUser(
      parsed.data,
      jwtSecret,
      jwtExpiresIn
    );
    setAuthCookie(res, accessToken, isProduction);

    res.status(201).json({
      success: true,
      data: { user, accessToken },
    });
  });

  const login = asyncHandler(async (req, res, next) => {
    const parsed = parseBody(loginBodySchema, req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
      return;
    }

    const { user, accessToken } = await loginUser(
      parsed.data,
      jwtSecret,
      jwtExpiresIn
    );
    setAuthCookie(res, accessToken, isProduction);

    res.json({
      success: true,
      data: { user, accessToken },
    });
  });

  const logout = asyncHandler(async (req, res) => {
    clearAuthCookie(res, isProduction);
    res.status(204).send();
  });

  return { register, login, logout };
}

module.exports = { createAuthController };
