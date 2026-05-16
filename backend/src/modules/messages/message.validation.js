const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid identifier");

const createMessageSchema = z.object({
  conversationId: objectIdString,
  content: z.string().min(1).max(8000),
});

function safeParseCreate(body) {
  return createMessageSchema.safeParse(body);
}

module.exports = { createMessageSchema, safeParseCreate };
