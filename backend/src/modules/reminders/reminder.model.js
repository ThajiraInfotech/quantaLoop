const mongoose = require("mongoose");

const REMINDER_TYPES = [
  "response_reminder",
  "inactive_conversation",
  "pending_opportunity",
  "saved_material_update",
];

const REMINDER_STATUS = ["open", "dismissed"];

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: REMINDER_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: REMINDER_STATUS,
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
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
    relatedConversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    dedupeKey: { type: String, required: true, index: true },
    dueAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, dedupeKey: 1 }, { unique: true });
reminderSchema.index({ user: 1, status: 1, updatedAt: -1 });

function toPublicReminder(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  return {
    id: o._id.toString(),
    type: o.type,
    title: o.title,
    message: o.message,
    status: o.status,
    priority: o.priority,
    materialId: o.relatedMaterial?.toString?.() ?? null,
    interestId: o.relatedInterest?.toString?.() ?? null,
    conversationId: o.relatedConversation?.toString?.() ?? null,
    dueAt: o.dueAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Reminder = mongoose.model("Reminder", reminderSchema);

module.exports = {
  Reminder,
  REMINDER_TYPES,
  REMINDER_STATUS,
  toPublicReminder,
};
