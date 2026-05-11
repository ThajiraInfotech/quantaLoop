const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { notifyBuyersOfNewMaterial } = require("../matches/match.service");
const { User } = require("../users/user.model");
const { Material, toPublicMaterial } = require("./material.model");
const { safeParseCreate, safeParseUpdate } = require("./material.validation");

function validationError(next, flatten) {
  next(
    new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten)
  );
}

function resolveProviderIdForCreate(req, data) {
  if (req.user.role === "admin") {
    if (data.providerUserId) {
      return data.providerUserId;
    }
    return req.user.id;
  }
  return req.user.id;
}

const listMaterials = asyncHandler(async (req, res, next) => {
  const { role, id: userId } = req.user;
  let query = Material.find();

  if (role === "material_provider") {
    query = query.where({ provider: userId });
  } else if (role === "verified_buyer") {
    query = query.where({
      status: "active",
      visibility: "network",
      provider: { $ne: new mongoose.Types.ObjectId(userId) },
    });
  }

  const docs = await query
    .sort({ updatedAt: -1 })
    .populate("provider", "companyName name email")
    .limit(200)
    .exec();

  const items = docs.map((d) => toPublicMaterial(d));
  sendSuccess(res, { items }, "Materials retrieved");
});

const getMaterialById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const doc = await Material.findById(id).populate(
    "provider",
    "companyName name email industryType location"
  );

  if (!doc) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const { role, id: userId } = req.user;
  const providerId = doc.provider?._id?.toString?.() ?? doc.provider?.toString();

  if (role === "material_provider" && providerId !== userId) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  if (role === "verified_buyer") {
    const buyerId = new mongoose.Types.ObjectId(userId);
    const isInterested = (doc.interestedBuyers ?? []).some((bid) =>
      bid.equals(buyerId)
    );
    const canViewNetwork =
      doc.status === "active" &&
      doc.visibility === "network" &&
      providerId !== userId;
    const canViewRestricted =
      doc.status === "active" &&
      doc.visibility === "restricted" &&
      isInterested;

    if (!canViewNetwork && !canViewRestricted) {
      next(new AppError("Forbidden", 403, "FORBIDDEN"));
      return;
    }
  }

  sendSuccess(res, { material: toPublicMaterial(doc) }, "Material retrieved");
});

const createMaterial = asyncHandler(async (req, res, next) => {
  const parsed = safeParseCreate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const data = parsed.data;
  const providerId = resolveProviderIdForCreate(req, data);

  if (req.user.role === "admin" && data.providerUserId) {
    const target = await User.findById(providerId).select("role");
    if (!target) {
      next(new AppError("Provider user not found", 404, "USER_NOT_FOUND"));
      return;
    }
    if (target.role !== "material_provider") {
      next(
        new AppError(
          "Materials can only be assigned to material providers",
          400,
          "INVALID_PROVIDER_ROLE"
        )
      );
      return;
    }
  }

  const payload = { ...data };
  delete payload.providerUserId;

  const material = await Material.create({
    ...payload,
    provider: providerId,
  });

  const populated = await Material.findById(material._id).populate(
    "provider",
    "companyName name email"
  );

  try {
    await notifyBuyersOfNewMaterial(populated);
  } catch {
    /* Matching notifications are best-effort and must not block publish */
  }

  sendSuccess(
    res,
    { material: toPublicMaterial(populated) },
    "Material is now visible on the network",
    201
  );
});

const updateMaterial = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid material id", 400, "INVALID_ID"));
    return;
  }

  const parsed = safeParseUpdate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const doc = await Material.findById(id);
  if (!doc) {
    next(new AppError("Material not found", 404, "NOT_FOUND"));
    return;
  }

  const providerId = doc.provider.toString();
  if (req.user.role === "material_provider" && providerId !== req.user.id) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  Object.assign(doc, parsed.data);
  await doc.save();

  const populated = await Material.findById(doc._id).populate(
    "provider",
    "companyName name email"
  );

  sendSuccess(res, { material: toPublicMaterial(populated) }, "Material updated");
});

module.exports = {
  listMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
};
