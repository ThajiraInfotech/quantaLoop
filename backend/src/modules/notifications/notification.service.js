const { Notification } = require("./notification.model");

/**
 * @param {object} payload
 * @param {import('mongoose').Types.ObjectId|string} payload.recipient
 * @param {string} payload.type
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {import('mongoose').Types.ObjectId|string|null} [payload.relatedMaterial]
 * @param {import('mongoose').Types.ObjectId|string|null} [payload.relatedInterest]
 */
async function createNotification(payload) {
  const doc = await Notification.create({
    recipient: payload.recipient,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    relatedMaterial: payload.relatedMaterial ?? null,
    relatedInterest: payload.relatedInterest ?? null,
  });
  return doc;
}

module.exports = { createNotification };
