/** Cloudflare Worker entry point for the KCS Teacher Evaluation app. */
import handler from "vinext/server/app-router-entry";

const APP_PATH = "/apps/teacher-evaluation";

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // The Next/Vinext app is intentionally mounted below APP_PATH so the same
    // deployment shape can later sit behind brycep.com without route changes.
    // Make the standalone workers.dev root useful during production testing.
    if (url.pathname === "/") {
      url.pathname = APP_PATH;
      return Response.redirect(url.toString(), 302);
    }

    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

export default worker;
