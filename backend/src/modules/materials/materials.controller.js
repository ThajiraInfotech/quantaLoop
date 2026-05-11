const { asyncHandler } = require("../../utils/asyncHandler");

const listMaterials = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { items: [] },
  });
});

module.exports = { listMaterials };
