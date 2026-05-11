const { z } = require("zod");

const publicRegistrationRoleSchema = z.enum([
  "material_provider",
  "verified_buyer",
]);

const registerBodySchema = z.object({
  name: z.string().min(1).max(120),
  companyName: z.string().min(1).max(200),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  role: publicRegistrationRoleSchema.optional(),
  industryType: z.string().max(120).optional(),
  materialTypes: z.array(z.string().max(80)).max(50).optional(),
  location: z.string().max(200).optional(),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

function parseBody(schema, body) {
  return schema.safeParse(body);
}

module.exports = {
  registerBodySchema,
  loginBodySchema,
  parseBody,
};
