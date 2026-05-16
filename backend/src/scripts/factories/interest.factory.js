const { Interest } = require("../../modules/interests/interest.model");
const { Material } = require("../../modules/materials/material.model");
const { pick, chance } = require("../utils/random");
const { pickBetween, daysAgo } = require("../utils/dates");
const {
  INTEREST_MESSAGES,
  INTEREST_TIMELINES,
} = require("../data/chennai-industrial");

/** Status distribution for demo-ready workflows */
const STATUS_PLAN = [
  { status: "pending", count: 12, oldPending: 6 },
  { status: "rejected", count: 8 },
  { status: "accepted", count: 10 },
  { status: "discussion", count: 12 },
  { status: "pickup_scheduled", count: 10 },
  { status: "completed", count: 10 },
  { status: "closed", count: 6 },
];

const ACTIVE_STATUSES = new Set([
  "accepted",
  "discussion",
  "pickup_scheduled",
  "completed",
  "closed",
]);

function materialStatusForInterest(status) {
  switch (status) {
    case "discussion":
    case "pickup_scheduled":
      return "in_discussion";
    case "completed":
      return "fulfilled";
    case "closed":
      return "available";
    case "rejected":
      return "available";
    default:
      return "available";
  }
}

async function createInterests(buyers, materials) {
  const networkMaterials = materials.filter(
    (m) => m.visibility === "network" && m.provider
  );
  const interests = [];
  const usedPairs = new Set();

  function takePair(buyer, material) {
    const key = `${buyer._id}:${material._id}`;
    if (usedPairs.has(key)) return false;
    if (material.provider.toString() === buyer._id.toString()) return false;
    usedPairs.add(key);
    return true;
  }

  for (const plan of STATUS_PLAN) {
    let created = 0;
    let oldLeft = plan.oldPending ?? 0;
    while (created < plan.count) {
      const buyer = pick(buyers);
      const material = pick(networkMaterials);
      if (!takePair(buyer, material)) continue;

      let createdAt = pickBetween(30, 3);
      const ageDays = Math.max(
        1,
        Math.floor((Date.now() - createdAt.getTime()) / 86400000)
      );
      let updatedAt = pickBetween(Math.min(20, ageDays), 0);

      if (plan.status === "pending" && oldLeft > 0) {
        createdAt = daysAgo(3 + Math.floor(Math.random() * 4));
        updatedAt = daysAgo(2);
        oldLeft -= 1;
      }

      if (
        ["accepted", "discussion"].includes(plan.status) &&
        chance(0.4)
      ) {
        updatedAt = daysAgo(6 + Math.floor(Math.random() * 3));
      }

      const doc = await Interest.create({
        material: material._id,
        buyer: buyer._id,
        provider: material.provider,
        message: pick(INTEREST_MESSAGES),
        pickupTimeline: pick(INTEREST_TIMELINES),
        status: plan.status,
        conversation: null,
      });

      await Interest.collection.updateOne(
        { _id: doc._id },
        { $set: { createdAt, updatedAt } }
      );
      doc.createdAt = createdAt;
      doc.updatedAt = updatedAt;
      doc.status = plan.status;
      interests.push(doc);

      const matStatus = materialStatusForInterest(plan.status);
      await Material.updateOne(
        { _id: material._id },
        {
          $set: { status: matStatus, updatedAt: updatedAt },
          $addToSet: { interestedBuyers: buyer._id },
        }
      );

      created += 1;
    }
  }

  return interests;
}

module.exports = { createInterests, ACTIVE_STATUSES };
