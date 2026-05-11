const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  getBuyerMaterialSuggestions,
  getProviderMatchSignals,
} = require("./match.service");

const getSuggestions = asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;

  if (role === "verified_buyer") {
    const data = await getBuyerMaterialSuggestions(userId);
    sendSuccess(res, data, "Suggestions retrieved");
    return;
  }

  if (role === "material_provider") {
    const data = await getProviderMatchSignals(userId);
    sendSuccess(res, data, "Signals retrieved");
    return;
  }

  if (role === "admin") {
    sendSuccess(
      res,
      {
        headlines: ["Administrative view — matching is buyer/provider scoped."],
        items: [],
        buyers: [],
      },
      ""
    );
    return;
  }

  sendSuccess(res, { items: [], headlines: [], buyers: [] }, "");
});

module.exports = { getSuggestions };
