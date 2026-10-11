-- Account deletion may anonymize the optional actor relation. This is the only allowed UPDATE:
-- every audit payload and identifier must remain byte-for-byte equivalent.
CREATE OR REPLACE FUNCTION "prevent_audit_event_update"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."actorId" IS NOT NULL
     AND NEW."actorId" IS NULL
     AND (to_jsonb(NEW) - 'actorId') = (to_jsonb(OLD) - 'actorId') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'AuditEvent is append-only';
END;
$$;
