/** Cloudflare Worker entry point for the KCS Teacher Evaluation demo. */
import handler from "vinext/server/app-router-entry";

const BASE_PATH = "/apps/teacher-evaluation";
const ACCESS_PATH = `${BASE_PATH}/__access`;
const COOKIE_NAME = "kcs_eval_access";
const COOKIE_MAX_AGE = 60 * 60 * 12;

type AccessEnv = Env & {
  EVAL_ACCESS_PASSWORD?: string;
};

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

async function accessToken(password: string): Promise<string> {
  const input = new TextEncoder().encode(`kcs-teacher-evaluation:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const bytes = String.fromCharCode(...new Uint8Array(digest));
  return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function accessPage(invalid = false): Response {
  const message = invalid
    ? '<p class="error">Incorrect password. Try again.</p>'
    : '<p class="hint">Enter the access password to continue.</p>';

  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>KCS Teacher Evaluation · Access</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f6f8; color: #0f233a; padding: 24px; }
    .card { width: min(100%, 420px); background: #fff; border: 1px solid #dfe5ea; border-radius: 16px; padding: 32px; box-shadow: 0 18px 48px rgba(15,35,58,.10); }
    .eyebrow { margin: 0 0 8px; color: #7a8793; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0 0 10px; font-size: 26px; line-height: 1.2; }
    .hint, .error { margin: 0 0 22px; font-size: 14px; }
    .hint { color: #66727d; }
    .error { color: #a42a38; font-weight: 600; }
    label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
    input { width: 100%; height: 46px; border: 1px solid #cbd4dc; border-radius: 10px; padding: 0 13px; font: inherit; outline: none; }
    input:focus { border-color: #173653; box-shadow: 0 0 0 3px rgba(23,54,83,.10); }
    button { width: 100%; height: 46px; margin-top: 14px; border: 0; border-radius: 10px; background: #0f233a; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    button:hover { background: #173653; }
    .back { display: inline-block; margin-top: 20px; color: #66727d; font-size: 13px; text-decoration: none; }
  </style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">KCS Chengdu</p>
    <h1>Teacher Evaluation Demo</h1>
    ${message}
    <form method="post" action="${ACCESS_PATH}">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Continue</button>
    </form>
    <a class="back" href="https://brycep.com/apps">← Back to apps</a>
  </main>
</body>
</html>`,
    {
      status: invalid ? 401 : 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, private",
        "x-robots-tag": "noindex, nofollow",
      },
    },
  );
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const password = (env as AccessEnv).EVAL_ACCESS_PASSWORD;

    if (!password) {
      return new Response("Teacher evaluation access password is not configured.", {
        status: 503,
        headers: { "cache-control": "no-store" },
      });
    }

    if (url.pathname === ACCESS_PATH && request.method === "POST") {
      const form = await request.formData();
      const submitted = String(form.get("password") || "");

      if (submitted !== password) return accessPage(true);

      const token = await accessToken(password);
      return new Response(null, {
        status: 303,
        headers: {
          location: BASE_PATH,
          "set-cookie": `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=${BASE_PATH}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          "cache-control": "no-store",
        },
      });
    }

    const expectedToken = await accessToken(password);
    if (getCookie(request, COOKIE_NAME) !== expectedToken) {
      return accessPage(false);
    }

    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

export default worker;
