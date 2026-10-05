export type IdentifierKind = "adult" | "student";

export function normalizeIdentifier(identifier: string): { kind: IdentifierKind; value: string } {
  const value = identifier.normalize("NFKC").trim();
  if (value.includes("@")) return { kind: "adult", value: value.toLocaleLowerCase("pt-BR") };
  return { kind: "student", value: value.toLocaleUpperCase("pt-BR") };
}
