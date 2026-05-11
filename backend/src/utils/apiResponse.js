function sendSuccess(res, data, message = "", statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

module.exports = { sendSuccess };
