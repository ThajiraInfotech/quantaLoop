const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  getMaterialRecommendations,
  getParticipantRecommendations,
} = require("./recommendation.service");

const listMaterialRecommendations = asyncHandler(async (req, res) => {
  const data = await getMaterialRecommendations(req.user);
  sendSuccess(res, data, "Material recommendations retrieved");
});

const listParticipantRecommendations = asyncHandler(async (req, res) => {
  const data = await getParticipantRecommendations(req.user);
  sendSuccess(res, data, "Participant recommendations retrieved");
});

module.exports = {
  listMaterialRecommendations,
  listParticipantRecommendations,
};
