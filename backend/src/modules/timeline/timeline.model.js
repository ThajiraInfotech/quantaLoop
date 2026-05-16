const mongoose = require("mongoose");

const TIMELINE_EVENT_TYPES = [
  "interest_received",
  "interest_accepted",
  "interest_rejected",
  "discussion_opened",
  "workflow_discussion",
  "workflow_pickup_scheduled",
  "workflow_completed",
  "workflow_closed",
  "message_posted",
  "material_status_changed",
  "opportunity_saved",
];

const timelineEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: TIMELINE_EVENT_TYPES, required: true, index: true },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
      index: true,
    },
    interest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interest",
      default: null,
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    audienceUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ],
    meta: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

timelineEventSchema.index({ audienceUsers: 1, createdAt: -1 });
timelineEventSchema.index({ material: 1, createdAt: -1 });

const TimelineEvent = mongoose.model("TimelineEvent", timelineEventSchema);

function toPublicTimelineEvent(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  return {
    id: o._id.toString(),
    type: o.type,
    summary: o.summary,
    actorId: o.actor?.toString?.() ?? null,
    materialId: o.material?.toString?.() ?? null,
    interestId: o.interest?.toString?.() ?? null,
    conversationId: o.conversation?.toString?.() ?? null,
    meta: o.meta ?? null,
    createdAt: o.createdAt,
  };
}

module.exports = {
  TimelineEvent,
  TIMELINE_EVENT_TYPES,
  toPublicTimelineEvent,
};
