import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { gameAnswerSchema } from "@/src/features/games/schemas";
import { answerGame, getGameSession } from "@/src/server/games/service";
import { technicalFailureResponse } from "@/src/server/operations/http";

const statusFor = (code: AuthorizationError["code"]) => ({ UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VALIDATION: 422, STATE_CONFLICT: 409, RATE_LIMITED: 429 })[code];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor; let gameId = "";
  try {
    actor = await requireUser(); gameId = (await params).id;
    const body = await request.json().catch(() => null);
    const parsed = gameAnswerSchema.safeParse({ ...(body && typeof body === "object" ? body : {}), gameId });
    if (!parsed.success) throw new AuthorizationError("VALIDATION", parsed.error.issues[0]?.message ?? "Resposta inválida.");
    return Response.json(await answerGame({ actor, ...parsed.data }), { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const game = error.code === "STATE_CONFLICT" && actor && gameId ? await getGameSession({ actor, gameId }).catch(() => null) : null;
      return Response.json({ error: error.code, message: error.message, game }, { status: statusFor(error.code), headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    }
    return technicalFailureResponse({ request, error, category: "game-api", code: "ANSWER_UNEXPECTED" });
  }
}
