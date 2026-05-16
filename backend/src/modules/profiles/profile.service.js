const mongoose = require("mongoose");

const { Interest } = require("../interests/interest.model");
const { Material } = require("../materials/material.model");
const { User } = require("../users/user.model");

async function computeTrustSignals(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [materialCount, interestInbound, interestOutbound, resolved] =
    await Promise.all([
      Material.countDocuments({
        provider: uid,
        status: { $in: ["available", "active", "in_discussion"] },
      }),
      Interest.countDocuments({ provider: uid, createdAt: { $gte: since } }),
      Interest.countDocuments({ buyer: uid, createdAt: { $gte: since } }),
      Interest.countDocuments({
        $or: [{ provider: uid }, { buyer: uid }],
        status: {
          $in: [
            "accepted",
            "rejected",
            "discussion",
            "pickup_scheduled",
            "completed",
            "closed",
          ],
        },
        updatedAt: { $gte: since },
      }),
    ]);

  const labels = [];
  if (materialCount >= 2) labels.push("Active network contributor");
  if (interestInbound >= 2 || interestOutbound >= 2) {
    labels.push("Frequently engaged");
  }
  if (resolved >= 3) labels.push("Responsive participant");

  const user = await User.findById(uid).select("responseRate").lean();
  if (user && typeof user.responseRate === "number" && user.responseRate >= 75) {
    labels.unshift("Fast response participant");
  }

  return {
    activeMaterials: materialCount,
    recentInboundInterests: interestInbound,
    recentOutboundInterests: interestOutbound,
    recentResolvedInterests: resolved,
    labels: Array.from(new Set(labels)).slice(0, 4),
  };
}

module.exports = { computeTrustSignals };
