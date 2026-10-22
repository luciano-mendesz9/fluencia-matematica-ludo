UPDATE "Minigame"
SET
  "slug" = 'math-race',
  "name" = 'Corrida Matemática',
  "description" = 'Resolva desafios e avance em uma corrida cheia de cálculos.',
  "icon" = '🏁',
  "status" = 'COMING_SOON',
  "sortOrder" = 1,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = '02820000-0000-4000-8000-000000000001';

INSERT INTO "Minigame" ("id", "slug", "name", "description", "icon", "status", "sortOrder", "updatedAt")
SELECT
  '02820000-0000-4000-8000-000000000001',
  'math-race',
  'Corrida Matemática',
  'Resolva desafios e avance em uma corrida cheia de cálculos.',
  '🏁',
  'COMING_SOON',
  1,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Minigame" WHERE "slug" = 'math-race'
);

DELETE FROM "Minigame" AS game
WHERE game."slug" NOT IN ('ludo', 'math-race')
  AND NOT EXISTS (
    SELECT 1 FROM "Activity" WHERE "Activity"."minigameId" = game."id"
  );
