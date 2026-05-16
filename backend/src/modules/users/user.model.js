const mongoose = require("mongoose");

const USER_ROLES = ["material_provider", "verified_buyer", "admin"];
const VERIFICATION_STATUS = ["unverified", "pending", "verified"];

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
    industriesHandled: [{ type: String, trim: true }],
    location: { type: String, trim: true, default: "" },
    companyDescription: { type: String, default: "", trim: true, maxlength: 8000 },
    website: { type: String, default: "", trim: true, maxlength: 500 },
    operationalLocation: { type: String, default: "", trim: true, maxlength: 300 },
    employeeRange: { type: String, default: "", trim: true, maxlength: 80 },
    establishedYear: { type: Number, min: 1800, max: 2100 },
    responseRate: { type: Number, min: 0, max: 100, default: 0 },
    averageResponseTime: { type: String, default: "", trim: true, maxlength: 120 },
    profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUS,
      default: "unverified",
      index: true,
    },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", function syncVerifiedFlag() {
  this.isVerified = this.verificationStatus === "verified";
});

const { computeProfileCompletion } = require("../../utils/profileCompletion");

function toPublicJSON(doc, options = {}) {
  const includeEmail = options.includeEmail !== false;
  const m = doc.toObject ? doc.toObject() : doc;
  const completion = computeProfileCompletion(m);

  const base = {
    id: m._id.toString(),
    name: m.name,
    companyName: m.companyName,
    role: m.role,
    industryType: m.industryType ?? "",
    materialTypes: m.materialTypes ?? [],
    industriesHandled: m.industriesHandled ?? [],
    location: m.location ?? "",
    companyDescription: m.companyDescription ?? "",
    website: m.website ?? "",
    operationalLocation: m.operationalLocation ?? "",
    employeeRange: m.employeeRange ?? "",
    establishedYear: m.establishedYear ?? null,
    responseRate: typeof m.responseRate === "number" ? m.responseRate : 0,
    averageResponseTime: m.averageResponseTime ?? "",
    profileCompletion: completion,
    verificationStatus: m.verificationStatus ?? "unverified",
    isVerified: Boolean(m.isVerified),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };

  if (includeEmail) {
    return { ...base, email: m.email };
  }
  return base;
}

const User = mongoose.model("User", userSchema);

module.exports = { User, USER_ROLES, VERIFICATION_STATUS, toPublicJSON };
