const { AppError } = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : undefined;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  const errorBody = { message, code };
  if (err instanceof AppError && err.details !== undefined) {
    errorBody.details = err.details;
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: errorBody,
  });
}

module.exports = errorHandler;
