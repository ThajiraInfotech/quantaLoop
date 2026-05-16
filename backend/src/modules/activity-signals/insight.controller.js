const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const { getOperationalInsights } = require("./insight.service");

const listInsights = asyncHandler(async (req, res) => {
  const data = await getOperationalInsights(req.user);
  sendSuccess(res, data, "Insights retrieved");
});

module.exports = { listInsights };
