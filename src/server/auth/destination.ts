type UserDestinationInput = {
  studentCode: string | null;
  globalRole: "SEMED_ADMIN" | "DEVELOPER" | null;
};

export type AuthArea = "admin" | "escola" | "professor" | "aluno" | "operacao" | "selecionar-escola";

export function destinationForUser(user: UserDestinationInput): `/${AuthArea}` {
  if (user.studentCode) return "/aluno";
  if (user.globalRole === "SEMED_ADMIN") return "/admin";
  if (user.globalRole === "DEVELOPER") return "/operacao";
  return "/selecionar-escola";
}
