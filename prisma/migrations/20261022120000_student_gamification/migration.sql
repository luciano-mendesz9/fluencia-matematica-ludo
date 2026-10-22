CREATE TYPE "AchievementMetric" AS ENUM (
  'TOTAL_XP',
  'PODIUM_FINISH',
  'DAILY_STREAK',
  'CORRECT_STREAK',
  'FIRST_PLACE',
  'CORRECT_ANSWERS',
  'RANK_LEVEL'
);

CREATE TYPE "MinigameStatus" AS ENUM ('ACTIVE', 'COMING_SOON');

CREATE TABLE "StudentRank" (
  "id" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "level" INTEGER NOT NULL,
  "xpRequired" INTEGER NOT NULL,
  "icon" VARCHAR(16) NOT NULL,
  "accent" VARCHAR(16) NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentRank_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentRank_level_check" CHECK ("level" BETWEEN 0 AND 9),
  CONSTRAINT "StudentRank_xp_required_check" CHECK (("level" = 0 AND "xpRequired" = 0) OR ("level" > 0 AND "xpRequired" = 50))
);

CREATE UNIQUE INDEX "StudentRank_code_key" ON "StudentRank"("code");
CREATE UNIQUE INDEX "StudentRank_level_key" ON "StudentRank"("level");
CREATE UNIQUE INDEX "StudentRank_sortOrder_key" ON "StudentRank"("sortOrder");
CREATE INDEX "StudentRank_level_xpRequired_idx" ON "StudentRank"("level", "xpRequired");

INSERT INTO "StudentRank" ("id", "code", "name", "level", "xpRequired", "icon", "accent", "sortOrder") VALUES
  ('02800000-0000-4000-8000-000000000000', 'BRONZE', 'Bronze', 0, 0, '🥉', '#B77946', 0),
  ('02800000-0000-4000-8000-000000000001', 'SILVER', 'Prata', 1, 50, '🥈', '#8693A6', 1),
  ('02800000-0000-4000-8000-000000000002', 'GOLD', 'Ouro', 2, 50, '🥇', '#D69E2E', 2),
  ('02800000-0000-4000-8000-000000000003', 'PLATINUM', 'Platina', 3, 50, '🛡️', '#6B9AAA', 3),
  ('02800000-0000-4000-8000-000000000004', 'SAPPHIRE', 'Safira', 4, 50, '🔷', '#2772DB', 4),
  ('02800000-0000-4000-8000-000000000005', 'RUBY', 'Rubi', 5, 50, '🔴', '#D9485F', 5),
  ('02800000-0000-4000-8000-000000000006', 'EMERALD', 'Esmeralda', 6, 50, '🟢', '#2F9E68', 6),
  ('02800000-0000-4000-8000-000000000007', 'DIAMOND', 'Diamante', 7, 50, '💎', '#4AA8C7', 7),
  ('02800000-0000-4000-8000-000000000008', 'MASTER', 'Mestre', 8, 50, '🌟', '#6E5DD5', 8),
  ('02800000-0000-4000-8000-000000000009', 'LEGEND', 'Lenda', 9, 50, '👑', '#7C3AED', 9);

CREATE TABLE "Achievement" (
  "id" UUID NOT NULL,
  "code" VARCHAR(60) NOT NULL,
  "title" VARCHAR(100) NOT NULL,
  "description" VARCHAR(240) NOT NULL,
  "metric" "AchievementMetric" NOT NULL,
  "threshold" INTEGER NOT NULL,
  "icon" VARCHAR(16) NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Achievement_threshold_check" CHECK ("threshold" > 0)
);

CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");
CREATE UNIQUE INDEX "Achievement_sortOrder_key" ON "Achievement"("sortOrder");
CREATE INDEX "Achievement_active_sortOrder_idx" ON "Achievement"("active", "sortOrder");

INSERT INTO "Achievement" ("id", "code", "title", "description", "metric", "threshold", "icon", "sortOrder") VALUES
  ('02810000-0000-4000-8000-000000000000', 'FIRST_PODIUM', 'Primeiro pódio', 'Fique entre os 3 primeiros da turma no mês.', 'PODIUM_FINISH', 3, '🏆', 0),
  ('02810000-0000-4000-8000-000000000001', 'LIT_FLAME', 'Chama acesa', 'Pratique por 3 dias seguidos.', 'DAILY_STREAK', 3, '🔥', 1),
  ('02810000-0000-4000-8000-000000000002', 'SUPERSTAR', 'Superestrela', 'Acumule 100 XP.', 'TOTAL_XP', 100, '🌟', 2),
  ('02810000-0000-4000-8000-000000000003', 'ON_TARGET', 'Na mosca!', 'Acerte 3 desafios seguidos.', 'CORRECT_STREAK', 3, '🎯', 3),
  ('02810000-0000-4000-8000-000000000004', 'CLASS_LEGEND', 'Lenda da turma', 'Chegue ao 1º lugar do ranking mensal.', 'FIRST_PLACE', 1, '👑', 4),
  ('02810000-0000-4000-8000-000000000005', 'XP_ROCKET', 'Foguete XP', 'Conquiste 250 XP.', 'TOTAL_XP', 250, '🚀', 5),
  ('02810000-0000-4000-8000-000000000006', 'BRILLIANT_MIND', 'Mente genial', 'Acerte 5 desafios.', 'CORRECT_ANSWERS', 5, '🧠', 6),
  ('02810000-0000-4000-8000-000000000007', 'DIAMOND_RANK', 'Diamante', 'Alcance a patente Diamante, nível 7.', 'RANK_LEVEL', 7, '💎', 7);

CREATE TABLE "StudentAchievement" (
  "id" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "achievementId" UUID NOT NULL,
  "unlockedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentAchievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentAchievement_studentId_achievementId_key" ON "StudentAchievement"("studentId", "achievementId");
CREATE INDEX "StudentAchievement_studentId_unlockedAt_idx" ON "StudentAchievement"("studentId", "unlockedAt");
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "StudentProfile" (
  "studentId" UUID NOT NULL,
  "skinTone" VARCHAR(30) NOT NULL DEFAULT 'medium',
  "outfitColor" VARCHAR(30) NOT NULL DEFAULT 'ocean',
  "hairStyle" VARCHAR(30) NOT NULL DEFAULT 'curly',
  "hairColor" VARCHAR(30) NOT NULL DEFAULT 'dark',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("studentId"),
  CONSTRAINT "StudentProfile_revision_check" CHECK ("revision" > 0),
  CONSTRAINT "StudentProfile_skin_tone_check" CHECK ("skinTone" IN ('light', 'medium-light', 'medium', 'deep')),
  CONSTRAINT "StudentProfile_outfit_color_check" CHECK ("outfitColor" IN ('ocean', 'violet', 'coral', 'mint', 'sunset')),
  CONSTRAINT "StudentProfile_hair_style_check" CHECK ("hairStyle" IN ('short', 'curly', 'coily', 'braids', 'waves')),
  CONSTRAINT "StudentProfile_hair_color_check" CHECK ("hairColor" IN ('dark', 'brown', 'auburn', 'golden', 'blue'))
);

ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Minigame" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(60) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(240) NOT NULL,
  "icon" VARCHAR(16) NOT NULL,
  "status" "MinigameStatus" NOT NULL DEFAULT 'COMING_SOON',
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Minigame_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Minigame_slug_key" ON "Minigame"("slug");
CREATE UNIQUE INDEX "Minigame_sortOrder_key" ON "Minigame"("sortOrder");
CREATE INDEX "Minigame_status_sortOrder_idx" ON "Minigame"("status", "sortOrder");

INSERT INTO "Minigame" ("id", "slug", "name", "description", "icon", "status", "sortOrder", "updatedAt") VALUES
  ('02820000-0000-4000-8000-000000000000', 'ludo', 'Ludo matemático', 'Avance no tabuleiro resolvendo desafios da atividade.', '🎲', 'ACTIVE', 0, CURRENT_TIMESTAMP),
  ('02820000-0000-4000-8000-000000000001', 'math-race', 'Corrida Matemática', 'Resolva desafios e avance em uma corrida cheia de cálculos.', '🏁', 'COMING_SOON', 1, CURRENT_TIMESTAMP);

ALTER TABLE "Activity" ADD COLUMN "minigameId" UUID;
UPDATE "Activity" SET "minigameId" = '02820000-0000-4000-8000-000000000000';
CREATE INDEX "Activity_minigameId_status_idx" ON "Activity"("minigameId", "status");
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_minigameId_fkey" FOREIGN KEY ("minigameId") REFERENCES "Minigame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
