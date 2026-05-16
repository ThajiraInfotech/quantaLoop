const mongoose = require("mongoose");

const { Interest } = require("../interests/interest.model");
const { Conversation } = require("../conversations/conversation.model");
const { Message } = require("../messages/message.model");
const { Material } = require("../materials/material.model");
const { User } = require("../users/user.model");

const MS_DAY = 24 * 60 * 60 * 1000;

function freshnessBoost(updatedAt) {
  if (!updatedAt) return 0;
  const ageDays = (Date.now() - new Date(updatedAt).getTime()) / MS_DAY;
  if (ageDays <= 2) return 18;
  if (ageDays <= 7) return 12;
  if (ageDays <= 14) return 6;
  return 0;
}

/**
 * Provider response quality 0–100 from recent interest handling.
 */
async function getProviderResponseQuality(providerId) {
  const uid = new mongoose.Types.ObjectId(providerId);
  const since = new Date(Date.now() - 30 * MS_DAY);

  const rows = await Interest.find({
    provider: uid,
    createdAt: { $gte: since },
  })
    .select("status createdAt updatedAt")
    .lean();

  if (!rows.length) return { score: 50, label: "Building response history" };

  let responded = 0;
  let fast = 0;
  for (const row of rows) {
    if (row.status === "pending") continue;
    responded += 1;
    const hours = (new Date(row.updatedAt) - new Date(row.createdAt)) / (1000 * 60 * 60);
    if (hours >= 0 && hours <= 48) fast += 1;
  }

  const rate = responded / rows.length;
  const fastRate = responded ? fast / responded : 0;
  const score = Math.min(100, Math.round(rate * 55 + fastRate * 45));

  let label = "Steady response posture";
  if (score >= 80) label = "High response quality";
  else if (score >= 60) label = "Reliable response patterns";
  else if (score < 40) label = "Response patterns developing";

  return { score, label };
}

/**
 * User engagement composite 0–100 for ranking and trust hints.
 */
async function computeUserEngagementScore(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - 30 * MS_DAY);
  const user = await User.findById(uid).select("role responseRate").lean();
  if (!user) return 0;

  let score = 0;

  if (user.role === "material_provider") {
    const [accepted, completed, materials] = await Promise.all([
      Interest.countDocuments({
        provider: uid,
        status: { $in: ["accepted", "discussion", "pickup_scheduled"] },
        updatedAt: { $gte: since },
      }),
      Interest.countDocuments({
        provider: uid,
        status: "completed",
        updatedAt: { $gte: since },
      }),
      Material.countDocuments({
        provider: uid,
        updatedAt: { $gte: since },
      }),
    ]);
    score += Math.min(40, accepted * 8 + completed * 12);
    score += Math.min(25, materials * 5);
    const quality = await getProviderResponseQuality(userId);
    score += Math.round(quality.score * 0.35);
  } else if (user.role === "verified_buyer") {
    const [outbound, activeThreads] = await Promise.all([
      Interest.countDocuments({ buyer: uid, createdAt: { $gte: since } }),
      Conversation.countDocuments({
        buyer: uid,
        status: "active",
        lastMessageAt: { $gte: since },
      }),
    ]);
    score += Math.min(50, outbound * 10 + activeThreads * 15);
  }

  if (typeof user.responseRate === "number" && user.responseRate >= 70) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Material activity signal for feed ranking.
 */
async function computeMaterialActivityScore(materialId) {
  const mid = new mongoose.Types.ObjectId(materialId);
  const since = new Date(Date.now() - 14 * MS_DAY);

  const [interestCount, recentInterest] = await Promise.all([
    Interest.countDocuments({
      material: mid,
      createdAt: { $gte: since },
    }),
    Interest.findOne({ material: mid })
      .sort({ updatedAt: -1 })
      .select("updatedAt status")
      .lean(),
  ]);

  let score = interestCount * 12;
  if (recentInterest) {
    if (["discussion", "pickup_scheduled"].includes(recentInterest.status)) {
      score += 25;
    } else if (recentInterest.status === "pending") {
      score += 15;
    }
  }

  return Math.min(100, score);
}

/**
 * Rank scored material rows for intelligent feed (buyer context).
 */
function rankScoredMaterials(rows) {
  return [...rows].sort((a, b) => {
    const sa = (a.relevanceScore ?? 0) + (a.activityScore ?? 0) + (a.freshnessScore ?? 0);
    const sb = (b.relevanceScore ?? 0) + (b.activityScore ?? 0) + (b.freshnessScore ?? 0);
    return sb - sa;
  });
}

module.exports = {
  freshnessBoost,
  getProviderResponseQuality,
  computeUserEngagementScore,
  computeMaterialActivityScore,
  rankScoredMaterials,
};
