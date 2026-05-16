const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const { Conversation } = require("../conversations/conversation.model");
const { appendTimelineEvent } = require("../timeline/timeline.service");
const { Message, toPublicMessage } = require("./message.model");
const { safeParseCreate } = require("./message.validation");

function validationError(next, flatten) {
  next(new AppError("Validation failed", 400, "VALIDATION_ERROR", flatten));
}

const createMessage = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") {
    next(new AppError("Admins have read-only access to threads", 403, "FORBIDDEN"));
    return;
  }

  const parsed = safeParseCreate(req.body);
  if (!parsed.success) {
    validationError(next, parsed.error.flatten());
    return;
  }

  const { conversationId, content } = parsed.data;

  const conv = await Conversation.findById(conversationId);
  if (!conv) {
    next(new AppError("Conversation not found", 404, "NOT_FOUND"));
    return;
  }

  if (conv.status !== "active") {
    next(new AppError("This coordination thread is closed", 400, "THREAD_CLOSED"));
    return;
  }

  const uid = req.user.id;
  const providerId = conv.provider.toString();
  const buyerId = conv.buyer.toString();
  if (uid !== providerId && uid !== buyerId) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  const msg = await Message.create({
    conversation: conv._id,
    sender: uid,
    content,
    attachments: [],
  });

  conv.lastMessageAt = new Date();
  await conv.save();

  await appendTimelineEvent({
    type: "message_posted",
    summary: "Coordination message posted.",
    actor: uid,
    material: conv.material,
    interest: conv.interest,
    conversation: conv._id,
    audienceUserIds: [providerId, buyerId],
    meta: { messageId: msg._id.toString() },
  });

  const populated = await Message.findById(msg._id).populate(
    "sender",
    "name companyName"
  );

  sendSuccess(
    res,
    { message: toPublicMessage(populated) },
    "Message recorded",
    201
  );
});

module.exports = { createMessage };
