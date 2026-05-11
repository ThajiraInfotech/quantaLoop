function notFound(req, res) {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  res.status(404).json({
    success: false,
    message,
    data: null,
    error: { message, code: "NOT_FOUND" },
  });
}

module.exports = notFound;
