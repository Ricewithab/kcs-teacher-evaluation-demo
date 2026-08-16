import { env } from "cloudflare:workers";
import { BASE_PATH } from "@/lib/paths";
import { database } from "@/lib/database";
import type { SessionIdentity, SystemAccessRole } from "@/lib/auth-types";

const COOKIE_NAME = "kcs_teacher_eval_session";
const SESSION_SECONDS = 60 * 60 * 12;
// Cloudflare Workers Web Crypto currently rejects PBKDF2 iteration counts above 100,000.
// The iteration count is stored per account, so a future school-server deployment can
// transparently raise this work factor or rehash accounts with a stronger KDF.
const PASSWORD_ITERATIONS = 100_000;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

type UserRow = {
  id: string;
  staff_id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  active: number;
  must_change_password: number;
  is_system_admin: number;
  failed_login_count: number;
  locked_until: string | null;
  name: string;
  position: string;
  division: string;
  department: string;
  system_role: SystemAccessRole;
  staff_active: number;
};

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return encodeHex(new Uint8Array(digest));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(actual: Uint8Array, expected: Uint8Array) {
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

export function validatePassword(password: string) {
  if (password.length < 12) return "Password must be at least 12 characters";
  if (password.length > 256) return "Password is too long";
  return null;
}

export async function createPasswordRecord(password: string) {
  const error = validatePassword(password);
  if (error) throw new Error(error);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return {
    hash: encodeBase64(hash),
    salt: encodeBase64(salt),
    iterations: PASSWORD_ITERATIONS,
  };
}

async function passwordMatches(password: string, row: UserRow) {
  const actual = await derivePassword(password, decodeBase64(row.password_salt), Number(row.password_iterations || PASSWORD_ITERATIONS));
  return constantTimeEqual(actual, decodeBase64(row.password_hash));
}

function asIdentity(row: UserRow): SessionIdentity {
  return {
    userId: row.id,
    staffId: row.staff_id,
    email: row.email,
    name: row.name,
    position: row.position,
    division: row.division,
    department: row.department,
    systemRole: row.system_role,
    isSystemAdmin: Boolean(row.is_system_admin),
    mustChangePassword: Boolean(row.must_change_password),
  };
}

function cookieValue(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function userSelect() {
  return `SELECT u.*, s.name, s.position, s.division, s.department, s.system_role,
    s.active AS staff_active
    FROM users u
    JOIN staff s ON s.id = u.staff_id`;
}

export async function authenticate(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const row = await database().prepare(`${userSelect()} WHERE u.email = ? LIMIT 1`).bind(normalized).first<UserRow>();
  if (!row || !row.active || !row.staff_active) return null;

  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) return null;

  const matches = await passwordMatches(password, row);
  if (!matches) {
    const failed = Number(row.failed_login_count ?? 0) + 1;
    const lockedUntil = failed >= MAX_FAILED_LOGINS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
      : null;
    await database().prepare(`UPDATE users SET failed_login_count = ?, locked_until = ?, updated_at = ? WHERE id = ?`)
      .bind(lockedUntil ? 0 : failed, lockedUntil, new Date().toISOString(), row.id)
      .run();
    return null;
  }

  const now = new Date().toISOString();
  await database().prepare(`UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, row.id)
    .run();
  return asIdentity(row);
}

export async function createSession(userId: string, request: Request) {
  const raw = encodeHex(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(raw);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_SECONDS * 1000).toISOString();
  await database().prepare("DELETE FROM user_sessions WHERE expires_at <= ?").bind(now.toISOString()).run();
  await database().prepare(`INSERT INTO user_sessions (id, token_hash, user_id, expires_at, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(`session-${crypto.randomUUID()}`, tokenHash, userId, expiresAt, now.toISOString(), now.toISOString())
    .run();

  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(raw)}; Path=${BASE_PATH}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;
}

export async function getAuthenticatedIdentity(request: Request): Promise<SessionIdentity | null> {
  const raw = cookieValue(request);
  if (!raw) return null;
  const tokenHash = await sha256(raw);
  const row = await database().prepare(`${userSelect()}
    JOIN user_sessions us ON us.user_id = u.id
    WHERE us.token_hash = ? AND us.expires_at > ? AND u.active = 1 AND s.active = 1
    LIMIT 1`)
    .bind(tokenHash, new Date().toISOString())
    .first<UserRow>();
  if (!row) return null;
  await database().prepare("UPDATE user_sessions SET last_seen_at = ? WHERE token_hash = ?")
    .bind(new Date().toISOString(), tokenHash)
    .run();
  return asIdentity(row);
}

export async function deleteSession(request: Request) {
  const raw = cookieValue(request);
  if (raw) await database().prepare("DELETE FROM user_sessions WHERE token_hash = ?").bind(await sha256(raw)).run();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=${BASE_PATH}; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function changePassword(identity: SessionIdentity, currentPassword: string, nextPassword: string) {
  const verified = await authenticate(identity.email, currentPassword);
  if (!verified) throw new Error("Current password is incorrect");
  const record = await createPasswordRecord(nextPassword);
  const now = new Date().toISOString();
  await database().prepare(`UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, must_change_password = 0, updated_at = ? WHERE id = ?`)
    .bind(record.hash, record.salt, record.iterations, now, identity.userId)
    .run();
  await database().prepare("DELETE FROM user_sessions WHERE user_id = ?").bind(identity.userId).run();
}

export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const random = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(random, (value) => alphabet[value % alphabet.length]).join("");
}

export async function insertUserAccount(input: {
  staffId: string;
  email: string;
  password: string;
  isSystemAdmin?: boolean;
  mustChangePassword?: boolean;
}) {
  const staff = await database().prepare("SELECT id FROM staff WHERE id = ? AND active = 1").bind(input.staffId).first();
  if (!staff) throw new Error("Staff member was not found or is inactive");
  const existing = await database().prepare("SELECT id FROM users WHERE staff_id = ? OR email = ? LIMIT 1")
    .bind(input.staffId, input.email.trim().toLowerCase()).first();
  if (existing) throw new Error("An account already exists for this staff member or email");
  const record = await createPasswordRecord(input.password);
  const id = `user-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await database().prepare(`INSERT INTO users
    (id, staff_id, email, password_hash, password_salt, password_iterations, active, must_change_password, is_system_admin,
      failed_login_count, locked_until, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 0, NULL, ?, ?)`)
    .bind(
      id,
      input.staffId,
      input.email.trim().toLowerCase(),
      record.hash,
      record.salt,
      record.iterations,
      input.mustChangePassword === false ? 0 : 1,
      input.isSystemAdmin ? 1 : 0,
      now,
      now,
    ).run();
  return id;
}

export async function verifyBootstrapToken(candidate: string) {
  const expected = String((env as unknown as Record<string, unknown>).BOOTSTRAP_TOKEN ?? "");
  if (!expected || !candidate) return false;
  const encoder = new TextEncoder();
  const actualBytes = encoder.encode(candidate);
  const expectedBytes = encoder.encode(expected);
  if (actualBytes.byteLength !== expectedBytes.byteLength) return false;
  return constantTimeEqual(actualBytes, expectedBytes);
}

export function mutationOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export function unauthorized(message = "Sign in required") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You do not have permission to do that") {
  return Response.json({ error: message }, { status: 403 });
}
