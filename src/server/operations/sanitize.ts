import "server-only";

import { randomUUID } from "node:crypto";

const forbiddenKeys = new Set([
  "authorization", "cookie", "email", "gabarito", "hash", "name", "normalizedemail",
  "password", "passwordhash", "passwd", "response", "answer", "secret", "setcookie",
  "student", "studentcode", "studentid", "studentname", "token", "tokenhash",
]);

const technicalKey = /^[a-zA-Z][a-zA-Z0-9_.-]{0,119}$/;
const correlationKey = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,119}$/;

export function sanitizeTechnicalText(value: unknown, maxLength = 500) {
  const input = typeof value === "string" ? value : String(value ?? "");
  return input
    .replace(/[\r\n\t]+/g, " ")
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/(https?:\/\/[^\s?#]+)[?#][^\s]*/gi, "$1")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, "[REDACTED_TOKEN]")
    .replace(/([?&](?:token|secret|password|code)=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[REDACTED_ID]")
    .trim()
    .slice(0, maxLength);
}

function normalizedKey(value: string) {
  return value.toLocaleLowerCase("en-US").replaceAll("_", "").replaceAll("-", "");
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return sanitizeTechnicalText(value, 300);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !forbiddenKeys.has(normalizedKey(key)))
      .slice(0, 30)
      .map(([key, item]) => [sanitizeTechnicalText(key, 80), sanitizeValue(item, depth + 1)]));
  }
  return sanitizeTechnicalText(typeof value, 80);
}

export function sanitizeTechnicalMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return sanitizeValue(value, 0) as Record<string, unknown>;
}

export function technicalIdentifier(value: string, label: string) {
  const normalized = value.trim();
  if (!technicalKey.test(normalized)) throw new Error(`${label} técnico inválido.`);
  return normalized;
}

export function correlationIdentifier(value?: string) {
  const normalized = value?.trim();
  return normalized && correlationKey.test(normalized) ? normalized : randomUUID();
}

export function isCorrelationIdentifier(value: string) {
  return correlationKey.test(value.trim());
}
