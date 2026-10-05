import { z } from "zod";

const schoolName = z.string().trim().min(2, "Informe o nome da escola.").max(160);
const externalCode = z.string().trim().max(80).optional().or(z.literal(""));

export const createSchoolSchema = z.object({ name: schoolName, externalCode });

export const updateSchoolSchema = z.object({
  schoolId: z.uuid(),
  revision: z.coerce.number().int().positive(),
  name: schoolName,
  externalCode,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const membershipSchema = z.object({
  schoolId: z.uuid(),
  adultEmail: z.email().max(320),
  role: z.enum(["COORDINATOR", "TEACHER"]),
});

export const suspendMembershipSchema = z.object({
  membershipId: z.uuid(),
  revision: z.coerce.number().int().positive(),
  schoolId: z.uuid(),
});

export const selectSchoolSchema = z.object({ schoolId: z.uuid() });
