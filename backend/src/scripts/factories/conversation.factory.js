const { Conversation } = require("../../modules/conversations/conversation.model");
const { Message } = require("../../modules/messages/message.model");
const { Interest } = require("../../modules/interests/interest.model");
const { pick, intBetween } = require("../utils/random");
const { pickBetween, daysAgo } = require("../utils/dates");
const { OPERATIONAL_MESSAGES } = require("../data/chennai-industrial");

async function createConversationsAndMessages(interests) {
  const conversations = [];
  const messages = [];

  const eligible = interests.filter((i) =>
    ["accepted", "discussion", "pickup_scheduled", "completed", "closed"].includes(
      i.status
    )
  );

  for (const interest of eligible) {
    const convCreated = pickBetween(25, 5);
    const conv = await Conversation.create({
      material: interest.material,
      interest: interest._id,
      provider: interest.provider,
      buyer: interest.buyer,
      status: interest.status === "closed" ? "closed" : "active",
      lastMessageAt: null,
    });

    await Conversation.collection.updateOne(
      { _id: conv._id },
      { $set: { createdAt: convCreated, updatedAt: convCreated } }
    );

    const threadMessages = intBetween(2, 6);
    let lastAt = convCreated;
    const participants = [interest.provider, interest.buyer];

    for (let m = 0; m < threadMessages; m += 1) {
      const sender = participants[m % 2];
      const msgAt =
        m === 0
          ? new Date(convCreated.getTime() + 3600000)
          : pickBetween(
              Math.floor((Date.now() - convCreated.getTime()) / 86400000),
              0
            );

      const msg = await Message.create({
        conversation: conv._id,
        sender,
        content: pick(OPERATIONAL_MESSAGES),
        attachments: [],
      });
      await Message.collection.updateOne(
        { _id: msg._id },
        { $set: { createdAt: msgAt, updatedAt: msgAt } }
      );
      lastAt = msgAt;
      messages.push(msg);
    }

    const lastMessageAt =
      interest.status === "accepted" && Math.random() < 0.25
        ? daysAgo(4)
        : lastAt;

    await Conversation.updateOne(
      { _id: conv._id },
      { $set: { lastMessageAt, updatedAt: lastMessageAt } }
    );
    conv.lastMessageAt = lastMessageAt;

    await Interest.updateOne(
      { _id: interest._id },
      { $set: { conversation: conv._id } }
    );
    interest.conversation = conv._id;

    conversations.push(conv);
  }

  return { conversations, messages };
}

module.exports = { createConversationsAndMessages };
