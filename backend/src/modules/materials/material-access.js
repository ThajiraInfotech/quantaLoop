const mongoose = require("mongoose");

const { isListedForNetworkBrowse } = require("./material-status.helper");

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
  const listed = isListedForNetworkBrowse(material.status);
  const canViewNetwork =
    listed && material.visibility === "network" && providerId !== userId;
  const canViewRestricted =
    listed && material.visibility === "restricted" && isInterested;

  return canViewNetwork || canViewRestricted;
}

module.exports = { buyerCanAccessMaterial };
