import { env } from "cloudflare:workers";

export function fileBucket(){return (env as unknown as Record<string,any>).kcs_teacher_evaluation_files??null}
export function safeFilename(value:string){return value.replace(/[^A-Za-z0-9._ -]/g,"_").replace(/\s+/g," ").trim().slice(0,120)||"file"}
export const ALLOWED_UPLOAD_TYPES=new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.presentationml.presentation","image/png","image/jpeg"]);
export const MAX_UPLOAD_BYTES=10*1024*1024;
