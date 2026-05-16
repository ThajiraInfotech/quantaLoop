const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { computeProfileCompletion } = require("../../utils/profileCompletion");
const { User, toPublicJSON } = require("../users/user.model");
const { computeTrustSignals } = require("./profile.service");
const { safeParsePatch } = require("./profile.validation");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

function applyProfilePatch(user, data) {
  const assign = [
    "name",
    "companyName",
    "companyDescription",
    "website",
    "industriesHandled",
    "industryType",
    "operationalLocation",
    "location",
    "employeeRange",
    "establishedYear",
    "responseRate",
    "averageResponseTime",
  ];
  for (const key of assign) {
    if (data[key] !== undefined) user[key] = data[key];
  }
  if (data.materialsHandled !== undefined) {
    user.materialTypes = data.materialsHandled;
  }
  if (data.materialTypes !== undefined) {
    user.materialTypes = data.materialTypes;
  }
  user.profileCompletion = computeProfileCompletion(user);
}

const getMyProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    next(new AppError("User not found", 404, "NOT_FOUND"));
    return;
  }

  const trustSignals = await computeTrustSignals(req.user.id);
  sendSuccess(
    res,
    { profile: toPublicJSON(user), trustSignals },
    "Profile retrieved"
  );
});

const patchMyProfile = asyncHandler(async (req, res, next) => {
  const parsed = safeParsePatch(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    next(new AppError("User not found", 404, "NOT_FOUND"));
    return;
  }

  applyProfilePatch(user, parsed.data);
  await user.save();

  const trustSignals = await computeTrustSignals(req.user.id);
  sendSuccess(res, { profile: toPublicJSON(user), trustSignals }, "Profile updated");
});

const getProfileById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid profile id", 400, "INVALID_ID"));
    return;
  }

  const isSelf = req.user.id === id;
  const query = User.findById(id).select("-password");
  if (!isSelf) {
    query.select("-email");
  }
  const user = await query.exec();
  if (!user) {
    next(new AppError("Profile not found", 404, "NOT_FOUND"));
    return;
  }
  const publicDoc = toPublicJSON(user, { includeEmail: isSelf });
  const trustSignals = await computeTrustSignals(id);

  sendSuccess(
    res,
    { profile: publicDoc, trustSignals },
    "Profile retrieved"
  );
});

module.exports = { getMyProfile, patchMyProfile, getProfileById };
