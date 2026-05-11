const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { buyerCanAccessMaterial } = require("../materials/material-access");
const { Material } = require("../materials/material.model");
const { createNotification } = require("../notifications/notification.service");
const { Interest, toPublicInterest } = require("./interest.model");
const { safeParseCreate, safeParseStatus } = require("./interest.validation");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

const createInterest = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "verified_buyer") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const parsed = safeParseCreate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const { materialId, message, pickupTimeline } = parsed.data;

  const material = await Material.findById(materialId).populate(
    "provider",
    "companyName name email"
  );
  if (!material) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const providerId =
    material.provider?._id?.toString?.() ?? material.provider?.toString?.();
  if (providerId === req.user.id) {
    next(
      new AppError(
        "You cannot express interest on your own material",
        400,
        "INVALID_SELF_INTEREST"
      )
    );
    return;
  }

  if (!buyerCanAccessMaterial(material, req.user.id)) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const existing = await Interest.findOne({
    material: material._id,
    buyer: req.user.id,
  });
  if (existing) {
    next(
      new AppError(
        "Interest already recorded for this material",
        409,
        "DUPLICATE_INTEREST"
      )
    );
    return;
  }

  const interest = await Interest.create({
    material: material._id,
    buyer: req.user.id,
    provider: providerId,
    message,
    pickupTimeline,
    status: "pending",
  });

  const populated = await Interest.findById(interest._id)
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location");

  await createNotification({
    recipient: providerId,
    type: "interest_received",
    title: "New interest on your material",
    message: `${populated.buyer?.companyName ?? "A buyer"} signaled interest on "${material.title}".`,
    relatedMaterial: material._id,
    relatedInterest: interest._id,
  });

  sendSuccess(
    res,
    { interest: toPublicInterest(populated) },
    "Interest recorded",
    201
  );
});

const listMyInterests = asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;
  let query = Interest.find();

  if (role === "material_provider") {
    query = query.where({ provider: userId });
  } else if (role === "verified_buyer") {
    query = query.where({ buyer: userId });
  }

  const docs = await query
    .sort({ updatedAt: -1 })
    .limit(200)
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location status")
    .exec();

  const items = docs.map((d) => toPublicInterest(d));
  sendSuccess(res, { items }, "Interests retrieved");
});

const getMyInterestForMaterial = asyncHandler(async (req, res, next) => {
  const { materialId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  if (req.user.role !== "verified_buyer") {
    sendSuccess(res, { interest: null }, "");
    return;
  }

  const interest = await Interest.findOne({
    material: materialId,
    buyer: req.user.id,
  })
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location");

  sendSuccess(
    res,
    { interest: interest ? toPublicInterest(interest) : null },
    ""
  );
});

const updateInterestStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid interest id", 400, "INVALID_ID"));
    return;
  }

  if (req.user.role !== "material_provider" && req.user.role !== "admin") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const parsed = safeParseStatus(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const interest = await Interest.findById(id).populate(
    "material",
    "title provider"
  );
  if (!interest) {
    next(new AppError("Interest not found", 404, "NOT_FOUND"));
    return;
  }

  const providerOnInterest = interest.provider.toString();
  if (
    req.user.role === "material_provider" &&
    providerOnInterest !== req.user.id
  ) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  if (interest.status !== "pending") {
    next(new AppError("Interest is no longer pending", 400, "INVALID_STATE"));
    return;
  }

  interest.status = parsed.data.status;
  await interest.save();

  const populated = await Interest.findById(interest._id)
    .populate("buyer", "companyName name email")
    .populate("material", "title materialType location");

  const notifType =
    parsed.data.status === "accepted"
      ? "interest_accepted"
      : "interest_rejected";
  const title =
    parsed.data.status === "accepted"
      ? "Interest accepted"
      : "Interest declined";

  await createNotification({
    recipient: interest.buyer,
    type: notifType,
    title,
    message: `Your interest in "${interest.material?.title ?? "a material"}" was ${parsed.data.status}.`,
    relatedMaterial: interest.material?._id ?? interest.material,
    relatedInterest: interest._id,
  });

  sendSuccess(res, { interest: toPublicInterest(populated) }, "Interest updated");
});

module.exports = {
  createInterest,
  listMyInterests,
  getMyInterestForMaterial,
  updateInterestStatus,
};
