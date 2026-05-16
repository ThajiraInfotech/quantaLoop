const mongoose = require("mongoose");

const {
  mapMaterialStatusForPublic,
} = require("../materials/material-status.helper");

const savedMaterialSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

savedMaterialSchema.index({ buyer: 1, material: 1 }, { unique: true });

function toPublicSavedMaterial(doc) {
  const o =
    doc && typeof doc === "object" && typeof doc.toObject === "function"
      ? doc.toObject()
      : doc;
  const mat = o.material;
  return {
    id: o._id.toString(),
    materialId:
      mat?._id?.toString?.() ?? mat?.toString?.() ?? String(mat ?? ""),
    title:
      mat && typeof mat === "object" && "title" in mat ? mat.title : "",
    materialType:
      mat && typeof mat === "object" && "materialType" in mat
        ? mat.materialType
        : "",
    location:
      mat && typeof mat === "object" && "location" in mat ? mat.location : "",
    status:
      mat && typeof mat === "object" && "status" in mat
        ? mapMaterialStatusForPublic(mat.status)
        : "",
    createdAt: o.createdAt,
  };
}

const SavedMaterial = mongoose.model("SavedMaterial", savedMaterialSchema);

module.exports = { SavedMaterial, toPublicSavedMaterial };
