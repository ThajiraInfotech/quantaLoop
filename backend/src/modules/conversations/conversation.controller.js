const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { Conversation, toPublicConversation } = require("./conversation.model");
const { Message, toPublicMessage } = require("../messages/message.model");

const listMyConversations = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const docs = await Conversation.find({
    $or: [{ provider: uid }, { buyer: uid }],
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(100)
    .populate("material", "title materialType location status")
    .exec();

  const items = docs.map((d) => toPublicConversation(d));
  sendSuccess(res, { items }, "Conversations retrieved");
});

const getConversationById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid conversation id", 400, "INVALID_ID"));
    return;
  }

  const doc = await Conversation.findById(id).populate(
    "material",
    "title materialType location status provider"
  );
  if (!doc) {
    next(new AppError("Conversation not found", 404, "NOT_FOUND"));
    return;
  }

  const providerId = doc.provider.toString();
  const buyerId = doc.buyer.toString();
  const isParticipant =
    providerId === req.user.id || buyerId === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isParticipant && !isAdmin) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  sendSuccess(res, { conversation: toPublicConversation(doc) }, "");
});

const listConversationMessages = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid conversation id", 400, "INVALID_ID"));
    return;
  }

  const conv = await Conversation.findById(id);
  if (!conv) {
    next(new AppError("Conversation not found", 404, "NOT_FOUND"));
    return;
  }

  const providerId = conv.provider.toString();
  const buyerId = conv.buyer.toString();
  const isParticipant =
    providerId === req.user.id || buyerId === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isParticipant && !isAdmin) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const limit = Math.min(
    80,
    Math.max(1, Number.parseInt(String(req.query.limit ?? "40"), 10) || 40)
  );
  const before = req.query.before;
  const q = Message.find({ conversation: conv._id }).sort({ createdAt: -1 });
  if (before && mongoose.Types.ObjectId.isValid(before)) {
    const cursor = await Message.findById(before).select("createdAt");
    if (cursor) {
      q.where({ createdAt: { $lt: cursor.createdAt } });
    }
  }

  const docs = await q
    .limit(limit)
    .populate("sender", "name companyName")
    .exec();

  const items = docs.map((m) => toPublicMessage(m)).reverse();
  const nextCursor = items.length ? items[0].id : null;

  sendSuccess(
    res,
    { items, pagination: { limit, nextBefore: nextCursor } },
    "Messages retrieved"
  );
});

module.exports = {
  listMyConversations,
  getConversationById,
  listConversationMessages,
};
