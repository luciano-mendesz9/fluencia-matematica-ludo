import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { getAuthorizedMedia } from "@/src/server/questions/content-service";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await requireUser();const {id}=await params;const media=await getAuthorizedMedia({actor,mediaId:id});return new Response(new Uint8Array(media.bytes),{headers:{"Content-Type":media.mimeType,"Content-Length":String(media.bytes.length),"Cache-Control":"private, no-store","Content-Security-Policy":"default-src 'none'; img-src 'self'","X-Content-Type-Options":"nosniff","ETag":`\"${media.contentHash}\"`}})}catch(error){if(error instanceof AuthorizationError)return new Response(error.code==="NOT_FOUND"?"Não encontrado.":"Acesso negado.",{status:error.code==="NOT_FOUND"?404:error.code==="UNAUTHENTICATED"?401:403});throw error}}
