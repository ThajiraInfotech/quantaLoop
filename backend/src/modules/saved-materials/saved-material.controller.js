const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { appendTimelineEvent } = require("../timeline/timeline.service");
const { Material } = require("../materials/material.model");
const { buyerCanAccessMaterial } = require("../materials/material-access");
const { SavedMaterial, toPublicSavedMaterial } = require("./saved-material.model");

const saveMaterial = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "verified_buyer") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const { materialId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const material = await Material.findById(materialId);
  if (!material) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  if (!buyerCanAccessMaterial(material, req.user.id)) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  try {
    await SavedMaterial.create({
      buyer: req.user.id,
      material: material._id,
    });
  } catch (e) {
    if (e && e.code === 11000) {
      next(
        new AppError("Material already saved", 409, "ALREADY_SAVED")
      );
      return;
    }
    throw e;
  }

  await appendTimelineEvent({
    type: "opportunity_saved",
    summary: `Opportunity saved for later review — “${material.title}”.`,
    actor: req.user.id,
    material: material._id,
    audienceUserIds: [req.user.id],
  });

  const doc = await SavedMaterial.findOne({
    buyer: req.user.id,
    material: material._id,
  })
    .populate("material", "title materialType location status")
    .exec();

  sendSuccess(res, { saved: toPublicSavedMaterial(doc) }, "Saved", 201);
});

const unsaveMaterial = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "verified_buyer") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const { materialId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const result = await SavedMaterial.deleteOne({
    buyer: req.user.id,
    material: materialId,
  });
  if (result.deletedCount === 0) {
    next(new AppError("Saved record not found", 404, "NOT_FOUND"));
    return;
  }

  sendSuccess(res, { removed: true }, "Removed");
});

const listSavedMaterials = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "verified_buyer") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const docs = await SavedMaterial.find({ buyer: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(200)
    .populate("material", "title materialType location status")
    .exec();

  const items = docs.map((d) => toPublicSavedMaterial(d));
  sendSuccess(res, { items }, "Saved opportunities retrieved");
});

module.exports = { saveMaterial, unsaveMaterial, listSavedMaterials };
