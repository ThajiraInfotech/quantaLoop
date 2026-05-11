const mongoose = require("mongoose");

const USER_ROLES = ["material_provider", "verified_buyer", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "material_provider",
    },
    industryType: { type: String, trim: true, default: "" },
    materialTypes: [{ type: String, trim: true }],
    location: { type: String, trim: true, default: "" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

function toPublicJSON(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    companyName: doc.companyName,
    email: doc.email,
    role: doc.role,
    industryType: doc.industryType,
    materialTypes: doc.materialTypes,
    location: doc.location,
    isVerified: doc.isVerified,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const User = mongoose.model("User", userSchema);

module.exports = { User, USER_ROLES, toPublicJSON };
