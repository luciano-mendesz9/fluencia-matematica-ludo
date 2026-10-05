import { describe, expect, it } from "vitest";
import { assertDatabaseEnvironmentConfiguration } from "../../src/server/database/environment";

const safeEnvironment = {
  APP_ENV_ID: "fluencia-matematica-e2e",
  DATABASE_URL: "postgresql://user:secret@ep-project-pooler.us-east-2.aws.neon.tech/fluencia_e2e?sslmode=require",
  DIRECT_URL: "postgresql://user:secret@ep-project.us-east-2.aws.neon.tech/fluencia_e2e?sslmode=require",
};

describe("database environment guard", () => {
  it("aceita URLs pooled/direta do mesmo Neon e um ambiente permitido", () => {
    expect(assertDatabaseEnvironmentConfiguration(safeEnvironment).appEnvId).toBe("fluencia-matematica-e2e");
  });

  it("recusa produção e ambiente sem identificação positiva", () => {
    expect(() => assertDatabaseEnvironmentConfiguration({ ...safeEnvironment, APP_ENV_ID: "production" })).toThrow(/produção recusada/);
    expect(() => assertDatabaseEnvironmentConfiguration({ ...safeEnvironment, APP_ENV_ID: undefined })).toThrow(/APP_ENV_ID não definida/);
  });

  it("recusa URLs de destinos lógicos divergentes", () => {
    expect(() => assertDatabaseEnvironmentConfiguration({
      ...safeEnvironment,
      DIRECT_URL: "postgresql://user:secret@ep-other.us-east-2.aws.neon.tech/fluencia_e2e?sslmode=require",
    })).toThrow(/mesmo destino lógico/);
  });

  it("não inclui credenciais na mensagem de erro", () => {
    expect(() => assertDatabaseEnvironmentConfiguration({
      ...safeEnvironment,
      DATABASE_URL: "postgresql://user:very-secret@localhost/fluencia_e2e",
    })).toThrowError(expect.not.stringContaining("very-secret"));
  });
});
