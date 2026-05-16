const mongoose = require("mongoose");

const REPORT_TARGET_TYPES = ["participant", "material"];
const REPORT_REASONS = [
  "misleading_information",
  "spam",
  "inactive_participant",
];
const REPORT_STATUS = ["open", "resolved"];

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: REPORT_TARGET_TYPES,
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetMaterial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: "", trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: REPORT_STATUS,
      default: "open",
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

function toPublicReport(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  return {
    id: o._id.toString(),
    reporterId: o.reporter?.toString?.() ?? String(o.reporter),
    targetType: o.targetType,
    targetUserId: o.targetUser?.toString?.() ?? null,
    targetMaterialId: o.targetMaterial?.toString?.() ?? null,
    reason: o.reason,
    details: o.details,
    status: o.status,
    resolvedBy: o.resolvedBy?.toString?.() ?? null,
    resolvedAt: o.resolvedAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Report = mongoose.model("Report", reportSchema);

module.exports = { Report, REPORT_TARGET_TYPES, REPORT_REASONS, toPublicReport };
