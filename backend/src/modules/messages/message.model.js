const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 8000 },
    attachments: {
      type: [
        {
          kind: { type: String, default: "placeholder" },
          ref: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

function toPublicMessage(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  const sender = o.sender;
  return {
    id: o._id.toString(),
    conversationId: o.conversation?.toString?.() ?? String(o.conversation),
    senderId: o.sender?.toString?.() ?? String(o.sender),
    senderName:
      sender && typeof sender === "object" && "name" in sender
        ? sender.name ?? ""
        : "",
    senderCompany:
      sender && typeof sender === "object" && "companyName" in sender
        ? sender.companyName ?? ""
        : "",
    content: o.content,
    attachments: o.attachments ?? [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Message = mongoose.model("Message", messageSchema);

module.exports = { Message, toPublicMessage };
