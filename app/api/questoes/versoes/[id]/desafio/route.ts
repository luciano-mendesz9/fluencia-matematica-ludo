import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { getChallengePreview } from "@/src/server/questions/content-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser();
    const { id } = await params;
    const challenge = await getChallengePreview({ actor, versionId: id });
    return Response.json(challenge, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json(
        { error: error.code === "NOT_FOUND" ? "Não encontrado." : "Acesso negado." },
        { status: error.code === "NOT_FOUND" ? 404 : error.code === "UNAUTHENTICATED" ? 401 : 403, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw error;
  }
}
