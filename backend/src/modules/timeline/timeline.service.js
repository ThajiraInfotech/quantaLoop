const mongoose = require("mongoose");

const { TimelineEvent, toPublicTimelineEvent } = require("./timeline.model");

/**
 * @param {object} params
 * @param {string} params.type
 * @param {string} params.summary
 * @param {import('mongoose').Types.ObjectId|string|null} [params.actor]
 * @param {import('mongoose').Types.ObjectId|string|null} [params.material]
 * @param {import('mongoose').Types.ObjectId|string|null} [params.interest]
 * @param {import('mongoose').Types.ObjectId|string|null} [params.conversation]
 * @param {(import('mongoose').Types.ObjectId|string)[]} params.audienceUserIds
 * @param {object} [params.meta]
 */
async function appendTimelineEvent(params) {
  const audienceUsers = (params.audienceUserIds ?? [])
    .filter(Boolean)
    .map((id) =>
      typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
    );
  const unique = [...new Set(audienceUsers.map((id) => id.toString()))].map(
    (s) => new mongoose.Types.ObjectId(s)
  );

  const doc = await TimelineEvent.create({
    type: params.type,
    summary: params.summary,
    actor: params.actor ?? null,
    material: params.material ?? null,
    interest: params.interest ?? null,
    conversation: params.conversation ?? null,
    audienceUsers: unique,
    meta: params.meta,
  });
  return doc;
}

async function listForMaterial(materialId, limit = 40) {
  if (!mongoose.Types.ObjectId.isValid(materialId)) return [];
  const docs = await TimelineEvent.find({ material: materialId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => toPublicTimelineEvent(d));
}

async function listForUser(userId, limit = 50) {
  const uid = new mongoose.Types.ObjectId(userId);
  const docs = await TimelineEvent.find({ audienceUsers: uid })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => toPublicTimelineEvent(d));
}

module.exports = { appendTimelineEvent, listForMaterial, listForUser };
