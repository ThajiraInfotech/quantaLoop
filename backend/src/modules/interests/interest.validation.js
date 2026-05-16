const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid identifier");

const createInterestSchema = z.object({
  materialId: objectIdString,
  message: z.string().max(2000).optional().default(""),
  pickupTimeline: z.string().max(500).optional().default(""),
});

const updateInterestStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

const updateInterestWorkflowSchema = z.object({
  status: z.enum(["discussion", "pickup_scheduled", "completed", "closed"]),
});

function safeParseCreate(body) {
  return createInterestSchema.safeParse(body);
}

function safeParseStatus(body) {
  return updateInterestStatusSchema.safeParse(body);
}

function safeParseWorkflow(body) {
  return updateInterestWorkflowSchema.safeParse(body);
}

module.exports = {
  createInterestSchema,
  updateInterestStatusSchema,
  updateInterestWorkflowSchema,
  safeParseCreate,
  safeParseStatus,
  safeParseWorkflow,
};
