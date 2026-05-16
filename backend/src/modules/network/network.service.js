const mongoose = require("mongoose");

const { Interest } = require("../interests/interest.model");
const { Material } = require("../materials/material.model");
const { User } = require("../users/user.model");

async function getNetworkOverview() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [verifiedUsers, activeMaterials, recentInterests, sample] =
    await Promise.all([
      User.countDocuments({ verificationStatus: "verified" }),
      Material.countDocuments({
        status: { $in: ["available", "active", "in_discussion"] },
      }),
      Interest.countDocuments({ createdAt: { $gte: since } }),
      User.find({ verificationStatus: "verified" })
        .select("companyName role")
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
    ]);

  return {
    verifiedParticipants: verifiedUsers,
    activeMaterials,
    recentOpportunityActivity: recentInterests,
    spotlight: sample.map((u) => ({
      companyName: u.companyName,
      role: u.role,
    })),
  };
}

module.exports = { getNetworkOverview };
