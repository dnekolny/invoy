// Creates a test user and a signed Better Auth session in the database from .env.local.
// Usage: node scripts/dev-session.mjs <output-cookie-file>
// Then set cookie "better-auth.session_token" to the file contents on http://localhost.
import fs from "node:fs";
import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { makeSignature } from "better-auth/crypto";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
  }),
);
const out = process.argv[2];
if (!out) throw new Error("missing output file");
const sql = neon(env.DATABASE_URL);
const userId = "test-user-claude";
await sql`insert into "user" (id, name, email, email_verified) values (${userId}, 'Testovací uživatel', 'test@invoy.local', true) on conflict (id) do nothing`;
const token = crypto.randomBytes(32).toString("base64url");
const expiresAt = new Date(Date.now() + 7 * 864e5);
await sql`insert into session (id, token, expires_at, user_id) values (${crypto.randomUUID()}, ${token}, ${expiresAt}, ${userId})`;
fs.writeFileSync(out, `${token}.${await makeSignature(token, env.BETTER_AUTH_SECRET)}`, { mode: 0o600 });
console.log("session cookie written to", out);
