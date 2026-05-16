const { Material } = require("../../modules/materials/material.model");
const { pick, intBetween, chance } = require("../utils/random");
const { pickBetween } = require("../utils/dates");
const { MATERIAL_TEMPLATES, CHENNAI_LOCATIONS } = require("../data/chennai-industrial");

const STATUS_WEIGHTS = [
  { status: "available", weight: 45 },
  { status: "active", weight: 10 },
  { status: "in_discussion", weight: 20 },
  { status: "fulfilled", weight: 15 },
  { status: "archived", weight: 7 },
  { status: "inactive", weight: 3 },
];

function pickStatus() {
  const total = STATUS_WEIGHTS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const row of STATUS_WEIGHTS) {
    r -= row.weight;
    if (r <= 0) return row.status;
  }
  return "available";
}

async function createMaterials(providers, targetCount = 80) {
  const materials = [];
  let n = 0;
  while (materials.length < targetCount) {
    for (const provider of providers) {
      if (materials.length >= targetCount) break;
      const tpl = pick(MATERIAL_TEMPLATES);
      const createdAt = pickBetween(45, 2);
      const updatedAt = new Date(
        createdAt.getTime() +
          Math.random() * (Date.now() - createdAt.getTime())
      );

      const qty = intBetween(tpl.qty[0], tpl.qty[1]);
      const doc = await Material.create({
        title: `${tpl.title} — Lot ${n + 1}`,
        materialType: tpl.materialType,
        description: tpl.description,
        quantity: qty,
        unit: tpl.unit,
        location: pick(CHENNAI_LOCATIONS),
        availabilityFrequency: pick([
          "one_time",
          "weekly",
          "monthly",
          "daily",
        ]),
        status: pickStatus(),
        provider: provider._id,
        industryType: provider.industryType,
        pickupAvailable: chance(0.7),
        estimatedValueRange: pick([
          "Commercial terms on request",
          "INR — indicative band shared after interest",
          "Value subject to inspection",
          "",
        ]),
        visibility: chance(0.92) ? "network" : "restricted",
        interestedBuyers: [],
      });

      await Material.collection.updateOne(
        { _id: doc._id },
        { $set: { createdAt, updatedAt } }
      );
      doc.createdAt = createdAt;
      doc.updatedAt = updatedAt;
      materials.push(doc);
      n += 1;
    }
  }
  return materials;
}

module.exports = { createMaterials };
