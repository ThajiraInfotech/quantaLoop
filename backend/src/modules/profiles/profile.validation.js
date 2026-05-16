const { z } = require("zod");

const patchProfileSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    companyName: z.string().min(1).max(200).optional(),
    companyDescription: z.string().max(8000).optional(),
    website: z
      .union([z.string().url().max(500), z.literal("")])
      .optional(),
    industriesHandled: z.array(z.string().max(120)).max(40).optional(),
    materialsHandled: z.array(z.string().max(120)).max(80).optional(),
    industryType: z.string().max(120).optional(),
    materialTypes: z.array(z.string().max(120)).max(80).optional(),
    operationalLocation: z.string().max(300).optional(),
    location: z.string().max(300).optional(),
    employeeRange: z.string().max(80).optional(),
    establishedYear: z.coerce.number().int().min(1800).max(2100).optional(),
    responseRate: z.coerce.number().min(0).max(100).optional(),
    averageResponseTime: z.string().max(120).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

function safeParsePatch(body) {
  return patchProfileSchema.safeParse(body);
}

module.exports = { patchProfileSchema, safeParsePatch };
