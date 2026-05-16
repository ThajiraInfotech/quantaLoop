const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const { getNetworkOverview } = require("./network.service");

const overview = asyncHandler(async (req, res) => {
  const data = await getNetworkOverview();
  sendSuccess(res, data, "Network overview retrieved");
});

module.exports = { overview };
