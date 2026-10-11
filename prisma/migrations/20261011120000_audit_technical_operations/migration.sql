-- FM-023 keeps audit events append-only while allowing explicit fixture cleanup and a future,
-- policy-authorized retention mechanism to delete rows. The application exposes no delete path.
CREATE OR REPLACE FUNCTION "prevent_audit_event_update"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent is append-only';
END;
$$;

CREATE TRIGGER "AuditEvent_prevent_update"
BEFORE UPDATE ON "AuditEvent"
FOR EACH ROW
EXECUTE FUNCTION "prevent_audit_event_update"();

CREATE TYPE "OperationalLogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

CREATE TABLE "OperationalLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "level" "OperationalLogLevel" NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "code" VARCHAR(120) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "correlationId" VARCHAR(120) NOT NULL,
  "metadata" JSONB,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalLog_level_occurredAt_idx" ON "OperationalLog"("level", "occurredAt");
CREATE INDEX "OperationalLog_category_occurredAt_idx" ON "OperationalLog"("category", "occurredAt");
CREATE INDEX "OperationalLog_correlationId_occurredAt_idx" ON "OperationalLog"("correlationId", "occurredAt");
