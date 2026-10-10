import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { gameRollSchema } from "@/src/features/games/schemas";
import { getGameSession, rollGame } from "@/src/server/games/service";

const statusFor = (code: AuthorizationError["code"]) => ({ UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VALIDATION: 422, STATE_CONFLICT: 409 })[code];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  let gameId = "";
  try {
    actor = await requireUser();
    gameId = (await params).id;
    const body = await request.json().catch(() => null);
    const parsed = gameRollSchema.safeParse({ ...(body && typeof body === "object" ? body : {}), gameId });
    if (!parsed.success) throw new AuthorizationError("VALIDATION", parsed.error.issues[0]?.message ?? "Lançamento inválido.");
    const result = await rollGame({ actor, ...parsed.data });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const current = error.code === "STATE_CONFLICT" && actor && gameId
        ? await getGameSession({ actor, gameId }).catch(() => null)
        : null;
      return Response.json({ error: error.code, message: error.message, game: current }, { status: statusFor(error.code), headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    }
    throw error;
  }
}
