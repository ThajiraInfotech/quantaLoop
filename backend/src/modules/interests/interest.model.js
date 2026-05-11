const mongoose = require("mongoose");

const INTEREST_STATUS = ["pending", "accepted", "rejected"];

const interestSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, default: "", trim: true, maxlength: 2000 },
    pickupTimeline: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: INTEREST_STATUS,
      default: "pending",
    },
  },
  { timestamps: true }
);

interestSchema.index({ material: 1, buyer: 1 }, { unique: true });
interestSchema.index({ provider: 1, status: 1, updatedAt: -1 });
interestSchema.index({ buyer: 1, updatedAt: -1 });

function serializeUserBrief(doc) {
  if (!doc || !doc._id) return null;
  return {
    id: doc._id.toString(),
    companyName: doc.companyName ?? "",
    name: doc.name ?? "",
    email: doc.email ?? "",
  };
}

function toPublicInterest(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const material = o.material;
  const buyer = o.buyer;
  const provider = o.provider;

  return {
    id: o._id.toString(),
    materialId:
      material?._id?.toString?.() ?? material?.toString?.() ?? String(material),
    materialTitle:
      material && typeof material === "object" && "title" in material
        ? material.title
        : "",
    buyer: serializeUserBrief(
      buyer && typeof buyer === "object" && "_id" in buyer ? buyer : null
    ),
    providerId:
      provider?._id?.toString?.() ?? provider?.toString?.() ?? String(provider),
    message: o.message,
    pickupTimeline: o.pickupTimeline,
    status: o.status,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Interest = mongoose.model("Interest", interestSchema);

module.exports = { Interest, INTEREST_STATUS, toPublicInterest };
