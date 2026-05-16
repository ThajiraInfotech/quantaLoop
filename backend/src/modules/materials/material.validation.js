const { z } = require("zod");
const mongoose = require("mongoose");

const availabilityEnum = z.enum(["one_time", "daily", "weekly", "monthly"]);
const statusEnum = z.enum([
  "available",
  "in_discussion",
  "fulfilled",
  "archived",
  "active",
  "inactive",
]);
const visibilityEnum = z.enum(["network", "restricted"]);

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid identifier");

const createMaterialSchema = z.object({
  title: z.string().min(1).max(200),
  materialType: z.string().min(1).max(120),
  description: z.string().max(5000).optional().default(""),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().min(1).max(60),
  location: z.string().min(1).max(300),
  availabilityFrequency: availabilityEnum,
  pickupAvailable: z.coerce.boolean(),
  estimatedValueRange: z.string().max(200).optional().default(""),
  industryType: z.string().max(120).optional().default(""),
  visibility: visibilityEnum.optional().default("network"),
  status: statusEnum.optional().default("available"),
  providerUserId: objectIdString.optional(),
});

const updateMaterialSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    materialType: z.string().min(1).max(120).optional(),
    description: z.string().max(5000).optional(),
    quantity: z.coerce.number().nonnegative().optional(),
    unit: z.string().min(1).max(60).optional(),
    location: z.string().min(1).max(300).optional(),
    availabilityFrequency: availabilityEnum.optional(),
    pickupAvailable: z.boolean().optional(),
    estimatedValueRange: z.string().max(200).optional(),
    industryType: z.string().max(120).optional(),
    visibility: visibilityEnum.optional(),
    status: statusEnum.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required to update",
  });

function safeParseCreate(body) {
  return createMaterialSchema.safeParse(body);
}

function safeParseUpdate(body) {
  return updateMaterialSchema.safeParse(body);
}

module.exports = {
  createMaterialSchema,
  updateMaterialSchema,
  safeParseCreate,
  safeParseUpdate,
};
