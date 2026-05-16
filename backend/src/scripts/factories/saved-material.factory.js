const { SavedMaterial } = require("../../modules/saved-materials/saved-material.model");
const { pickN } = require("../utils/random");
const { pickBetween } = require("../utils/dates");

async function createSavedMaterials(buyers, materials) {
  const saved = [];
  const network = materials.filter((m) => m.visibility === "network");

  for (const buyer of buyers) {
    const picks = pickN(network, 3 + Math.floor(Math.random() * 4));
    for (const mat of picks) {
      if (mat.provider.toString() === buyer._id.toString()) continue;
      try {
        const createdAt = pickBetween(30, 1);
        const doc = await SavedMaterial.create({
          buyer: buyer._id,
          material: mat._id,
        });
        await SavedMaterial.collection.updateOne(
          { _id: doc._id },
          { $set: { createdAt, updatedAt: pickBetween(7, 0) } }
        );

        saved.push(doc);
      } catch {
        /* duplicate pair */
      }
    }
  }

  return saved;
}

module.exports = { createSavedMaterials };
