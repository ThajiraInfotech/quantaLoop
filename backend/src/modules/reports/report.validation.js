const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid identifier");

const createReportSchema = z
  .object({
    targetType: z.enum(["participant", "material"]),
    targetUserId: objectIdString.optional(),
    targetMaterialId: objectIdString.optional(),
    reason: z.enum([
      "misleading_information",
      "spam",
      "inactive_participant",
    ]),
    details: z.string().max(2000).optional().default(""),
  })
  .refine(
    (o) =>
      (o.targetType === "participant" && o.targetUserId) ||
      (o.targetType === "material" && o.targetMaterialId),
    { message: "targetUserId or targetMaterialId required for target type" }
  );

const resolveReportSchema = z.object({
  status: z.enum(["resolved"]),
});

function safeParseCreate(body) {
  return createReportSchema.safeParse(body);
}

function safeParseResolve(body) {
  return resolveReportSchema.safeParse(body);
}

module.exports = { createReportSchema, resolveReportSchema, safeParseCreate, safeParseResolve };
