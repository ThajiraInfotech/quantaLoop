const { Report } = require("../../modules/reports/report.model");
const { pick, chance } = require("../utils/random");
const { pickBetween } = require("../utils/dates");

const REPORT_DETAILS = {
  misleading_information: [
    "Quantity on listing does not match site inspection notes from last week.",
    "Material type label appears inconsistent with sample photos shared.",
    "Estimated availability frequency does not align with operator statements.",
  ],
  spam: [
    "Duplicate listings observed for the same lot reference.",
    "Repeated unsolicited outreach outside platform workflow.",
  ],
  inactive_participant: [
    "No response to coordination messages over multiple business days.",
    "Interest left pending without operational follow-up.",
  ],
};

async function createReports({ buyers, providers, materials, admins }) {
  const reports = [];
  const reporters = [...buyers.slice(0, 6), ...providers.slice(0, 4)];
  const admin = admins[0];

  for (let i = 0; i < 10; i += 1) {
    const reporter = pick(reporters);
    const reason = pick([
      "misleading_information",
      "spam",
      "inactive_participant",
    ]);
    const isMaterial = chance(0.55);
    const targetMaterial = isMaterial ? pick(materials) : null;
    const targetUser = isMaterial
      ? null
      : pick(providers.filter((p) => p._id.toString() !== reporter._id.toString()));

    const resolved = chance(0.35);
    const createdAt = pickBetween(20, 1);

    const doc = await Report.create({
      reporter: reporter._id,
      targetType: isMaterial ? "material" : "participant",
      targetUser: targetUser?._id ?? null,
      targetMaterial: targetMaterial?._id ?? null,
      reason,
      details: pick(REPORT_DETAILS[reason]),
      status: resolved ? "resolved" : "open",
      resolvedBy: resolved ? admin._id : null,
      resolvedAt: resolved ? pickBetween(10, 0) : null,
    });

    await Report.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt, updatedAt: createdAt } }
    );
    reports.push(doc);
  }

  return reports;
}

module.exports = { createReports };
