import { z } from "zod";

const schoolId = z.uuid("Escola inválida.");
const academicYearId = z.uuid("Ano letivo inválido.");
const classGroupId = z.uuid("Turma inválida.");
const revision = z.coerce.number().int().positive("Revisão inválida.");
const year = z.coerce.number().int().min(2000, "Informe um ano a partir de 2000.").max(2100, "Informe um ano até 2100.");
const grade = z.coerce.number().int().min(1, "Selecione uma série válida.").max(5, "Selecione uma série válida.");
const name = z.string().trim().min(1, "Informe o nome da turma.").max(120, "O nome deve ter até 120 caracteres.");

export const createAcademicYearSchema = z.object({ schoolId, year });

export const updateAcademicYearSchema = z.object({
  schoolId,
  academicYearId,
  revision,
  year,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const createClassGroupSchema = z.object({ schoolId, academicYearId, grade, name });

export const updateClassGroupSchema = z.object({
  schoolId,
  classGroupId,
  academicYearId,
  revision,
  grade,
  name,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
