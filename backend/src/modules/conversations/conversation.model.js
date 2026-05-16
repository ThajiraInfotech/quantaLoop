const mongoose = require("mongoose");

const CONVERSATION_STATUS = ["active", "closed"];

const conversationSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    interest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interest",
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: CONVERSATION_STATUS,
      default: "active",
    },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ provider: 1, updatedAt: -1 });
conversationSchema.index({ buyer: 1, updatedAt: -1 });

function toPublicConversation(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  const mat = o.material;
  return {
    id: o._id.toString(),
    materialId:
      mat?._id?.toString?.() ?? mat?.toString?.() ?? String(mat ?? ""),
    materialTitle:
      mat && typeof mat === "object" && "title" in mat ? mat.title : "",
    interestId: o.interest?.toString?.() ?? String(o.interest),
    providerId: o.provider?.toString?.() ?? String(o.provider),
    buyerId: o.buyer?.toString?.() ?? String(o.buyer),
    status: o.status,
    lastMessageAt: o.lastMessageAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = { Conversation, CONVERSATION_STATUS, toPublicConversation };
