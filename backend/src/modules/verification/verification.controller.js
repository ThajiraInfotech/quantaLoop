const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { User, toPublicJSON } = require("../users/user.model");
const { safeParseVerification } = require("./verification.validation");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

const listPendingVerifications = asyncHandler(async (req, res) => {
  const users = await User.find({ verificationStatus: "pending" })
    .select("name companyName email role createdAt")
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  const items = users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    companyName: u.companyName,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));

  sendSuccess(res, { items }, "Pending verifications");
});

const patchUserVerification = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    next(new AppError("Invalid user id", 400, "INVALID_ID"));
    return;
  }

  const parsed = safeParseVerification(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    next(new AppError("User not found", 404, "NOT_FOUND"));
    return;
  }

  user.verificationStatus = parsed.data.verificationStatus;
  await user.save();

  sendSuccess(
    res,
    { user: toPublicJSON(user) },
    "Verification status updated"
  );
});

module.exports = { listPendingVerifications, patchUserVerification };
