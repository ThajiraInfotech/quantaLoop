const mongoose = require("mongoose");

/**
 * Whether a verified buyer may view / act on a material (aligned with material.controller).
 */
function buyerCanAccessMaterial(material, userId) {
  const providerId =
    material.provider?._id?.toString?.() ?? material.provider?.toString?.();
  if (!providerId || providerId === userId) {
    return false;
  }

  const buyerId = new mongoose.Types.ObjectId(userId);
  const isInterested = (material.interestedBuyers ?? []).some((bid) =>
    bid.equals(buyerId)
  );
  const canViewNetwork =
    material.status === "active" &&
    material.visibility === "network" &&
    providerId !== userId;
  const canViewRestricted =
    material.status === "active" &&
    material.visibility === "restricted" &&
    isInterested;

  return canViewNetwork || canViewRestricted;
}

module.exports = { buyerCanAccessMaterial };
