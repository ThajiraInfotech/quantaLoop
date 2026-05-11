const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "interest_received",
  "interest_accepted",
  "interest_rejected",
  "new_matching_material",
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    relatedMaterial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
    relatedInterest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interest",
      default: null,
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

function toPublicNotification(doc) {
  const n = doc.toObject ? doc.toObject() : doc;
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    relatedMaterialId: n.relatedMaterial
      ? n.relatedMaterial.toString()
      : null,
    relatedInterestId: n.relatedInterest
      ? n.relatedInterest.toString()
      : null,
    isRead: n.isRead,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = {
  Notification,
  NOTIFICATION_TYPES,
  toPublicNotification,
};
