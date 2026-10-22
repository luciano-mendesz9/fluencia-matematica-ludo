"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { HAIR_COLORS, HAIR_STYLES, OUTFIT_COLORS, SKIN_TONES } from "@/src/domain/avatar";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { updateStudentAvatar } from "@/src/server/gamification/service";

const avatarSchema = z.object({
  skinTone: z.enum(SKIN_TONES),
  outfitColor: z.enum(OUTFIT_COLORS),
  hairStyle: z.enum(HAIR_STYLES),
  hairColor: z.enum(HAIR_COLORS),
  revision: z.coerce.number().int().min(0),
});

export type AvatarActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  revision?: number;
};

export async function updateAvatarAction(_state: AvatarActionState, formData: FormData): Promise<AvatarActionState> {
  const parsed = avatarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Opções de avatar inválidas." };
  try {
    const { revision, ...options } = parsed.data;
    const result = await updateStudentAvatar({ actor: await requireUser(), options, revision });
    revalidatePath("/aluno");
    revalidatePath("/aluno/perfil");
    revalidatePath("/aluno/ranking");
    return { status: "success", message: "Avatar salvo no seu perfil.", revision: result.revision };
  } catch (error) {
    return { status: "error", message: error instanceof AuthorizationError ? error.message : "Não foi possível salvar o avatar." };
  }
}
