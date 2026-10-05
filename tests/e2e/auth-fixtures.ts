export const authFixtures = {
  password: "FM004-Teste!2026",
  adult: {
    identifier: "fm004.adulto@example.invalid",
    name: "Adulto FM-004",
  },
  student: {
    identifier: "FM004-ALUNO",
    name: "Aluno FM-004",
  },
  blocked: {
    identifier: "fm004.bloqueado@example.invalid",
    name: "Bloqueado FM-004",
  },
  invalidIdentifier: "inexistente@example.invalid",
  rateIdentifier: "limite@example.invalid",
} as const;
