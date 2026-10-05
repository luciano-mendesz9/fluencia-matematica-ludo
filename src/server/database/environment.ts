const allowedEnvironmentIds = [
  "fluencia-matematica-development",
  "fluencia-matematica-test",
  "fluencia-matematica-e2e",
] as const;

type AllowedEnvironmentId = (typeof allowedEnvironmentIds)[number];

export type DatabaseEnvironment = {
  appEnvId: AllowedEnvironmentId;
  databaseUrl: string;
  directUrl: string;
};

type EnvironmentInput = {
  [key: string]: string | undefined;
  APP_ENV_ID?: string;
  DATABASE_URL?: string;
  DIRECT_URL?: string;
};

function required(input: string | undefined, name: keyof EnvironmentInput) {
  if (!input) throw new Error(`[database] ${name} não definida.`);
  return input;
}

function parseDatabaseUrl(raw: string, name: "DATABASE_URL" | "DIRECT_URL") {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`[database] ${name} não é uma URL PostgreSQL válida.`);
  }

  if (!(["postgres:", "postgresql:"] as string[]).includes(parsed.protocol)) {
    throw new Error(`[database] ${name} deve usar PostgreSQL.`);
  }
  if (!parsed.hostname.endsWith(".neon.tech")) {
    throw new Error(`[database] ${name} deve apontar para um host Neon autorizado.`);
  }
  if (!parsed.username || !parsed.password || parsed.pathname === "/") {
    throw new Error(`[database] ${name} está incompleta.`);
  }
  return parsed;
}

function logicalHost(hostname: string) {
  return hostname.replace("-pooler.", ".");
}

export function assertDatabaseEnvironmentConfiguration(input: EnvironmentInput): DatabaseEnvironment {
  const appEnvId = required(input.APP_ENV_ID, "APP_ENV_ID");
  if (!allowedEnvironmentIds.includes(appEnvId as AllowedEnvironmentId)) {
    throw new Error("[database] APP_ENV_ID não pertence à allowlist de desenvolvimento/teste; produção recusada.");
  }

  const databaseUrl = required(input.DATABASE_URL, "DATABASE_URL");
  const directUrl = required(input.DIRECT_URL, "DIRECT_URL");
  const runtime = parseDatabaseUrl(databaseUrl, "DATABASE_URL");
  const direct = parseDatabaseUrl(directUrl, "DIRECT_URL");

  if (!runtime.hostname.includes("-pooler.")) {
    throw new Error("[database] DATABASE_URL deve ser a conexão pooled do Neon.");
  }
  if (direct.hostname.includes("-pooler.")) {
    throw new Error("[database] DIRECT_URL deve ser a conexão direta do Neon.");
  }
  if (logicalHost(runtime.hostname) !== logicalHost(direct.hostname) || runtime.pathname !== direct.pathname) {
    throw new Error("[database] DATABASE_URL e DIRECT_URL não identificam o mesmo destino lógico.");
  }

  return { appEnvId: appEnvId as AllowedEnvironmentId, databaseUrl, directUrl };
}

export function readDatabaseEnvironment() {
  return assertDatabaseEnvironmentConfiguration(process.env);
}
