const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { Material } = require("../materials/material.model");
const { User } = require("../users/user.model");
const { Report, toPublicReport } = require("./report.model");
const { safeParseCreate, safeParseResolve } = require("./report.validation");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

const createReport = asyncHandler(async (req, res, next) => {
  const parsed = safeParseCreate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const data = parsed.data;
  if (data.targetUserId === req.user.id) {
    next(new AppError("You cannot report yourself", 400, "INVALID_TARGET"));
    return;
  }

  if (data.targetType === "participant") {
    const u = await User.findById(data.targetUserId).select("_id");
    if (!u) {
      next(new AppError("User not found", 404, "NOT_FOUND"));
      return;
    }
  } else {
    const m = await Material.findById(data.targetMaterialId).select("_id");
    if (!m) {
      next(new AppError("Material not found", 404, "NOT_FOUND"));
      return;
    }
  }

  const doc = await Report.create({
    reporter: req.user.id,
    targetType: data.targetType,
    targetUser: data.targetUserId ?? null,
    targetMaterial: data.targetMaterialId ?? null,
    reason: data.reason,
    details: data.details,
    status: "open",
  });

  sendSuccess(res, { report: toPublicReport(doc) }, "Report submitted", 201);
});

const listReports = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const statusFilter = req.query.status;
  let q = Report.find();
  if (statusFilter === "resolved") {
    q = q.where({ status: "resolved" });
  } else if (statusFilter === "all") {
    /* no filter */
  } else {
    q = q.where({ status: "open" });
  }

  const docs = await q.sort({ createdAt: -1 }).limit(100).lean();

  const items = docs.map((d) => toPublicReport(d));
  sendSuccess(res, { items }, "Reports retrieved");
});

const resolveReport = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid report id", 400, "INVALID_ID"));
    return;
  }

  const parsed = safeParseResolve(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const doc = await Report.findById(id);
  if (!doc) {
    next(new AppError("Report not found", 404, "NOT_FOUND"));
    return;
  }

  doc.status = "resolved";
  doc.resolvedBy = req.user.id;
  doc.resolvedAt = new Date();
  await doc.save();

  sendSuccess(res, { report: toPublicReport(doc) }, "Report resolved");
});

module.exports = { createReport, listReports, resolveReport };
