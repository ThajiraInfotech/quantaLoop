const { z } = require("zod");

const verificationStatusSchema = z.enum([
  "unverified",
  "pending",
  "verified",
]);

const patchVerificationSchema = z.object({
  verificationStatus: verificationStatusSchema,
});

function safeParseVerification(body) {
  return patchVerificationSchema.safeParse(body);
}

module.exports = { verificationStatusSchema, safeParseVerification };
